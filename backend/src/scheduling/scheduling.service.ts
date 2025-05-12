import { Injectable, BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CalendarService } from '../calendar/calendar.service';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { SchedulingLink } from './schemas/scheduling-link.schema';
import { Booking } from './schemas/booking.schema';
import * as nodemailer from 'nodemailer';
import { Client } from '@hubspot/api-client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';
import { FilterOperatorEnum, PublicObjectSearchRequest } from '@hubspot/api-client/lib/codegen/crm/contacts';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/objects';
import { User } from '../auth/user.schema';
import {google} from "googleapis";

interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    hs_notes_latest?: string;
  };
}

@Injectable()
export class SchedulingService {
  private hubspotClient: Client;
  private readonly defaultStartHour = 9;
  private readonly defaultEndHour = 17;
  private readonly defaultSlotDuration = 30;
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
      private readonly calendarService: CalendarService,
      @InjectModel(SchedulingLink.name) private schedulingLinkModel: Model<SchedulingLink>,
      @InjectModel(Booking.name) private bookingModel: Model<Booking>,
      @InjectModel(User.name) private userModel: Model<User>,
      private readonly configService: ConfigService,
      private readonly authService: AuthService,
  ) {
    this.validateEnvironmentVariables();
    this.hubspotClient = new Client({ accessToken: this.configService.get<string>('HUBSPOT_ACCESS_TOKEN') });
  }

  private validateEnvironmentVariables() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const requiredVars = [
      'HUBSPOT_ACCESS_TOKEN',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
      'ADVISOR_EMAIL',
      'GOOGLE_ACCESS_TOKEN',
      'LINKEDIN_SCRAPING_SERVICE_URL',
    ];

    const missingVars = requiredVars.filter(varName => !this.configService.get<string>(varName));
    if (missingVars.length > 0) {
      throw new InternalServerErrorException(
          `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }
  }

  private async validateSchedulingLink(linkId: string): Promise<SchedulingLink> {
    const link = await this.schedulingLinkModel.findById(linkId);
    if (!link) {
      throw new BadRequestException('Invalid scheduling link');
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new BadRequestException('Scheduling link has expired');
    }

    if (link.maxUses && link.uses >= link.maxUses) {
      throw new BadRequestException('Scheduling link has reached maximum uses');
    }

    return link;
  }

  private validateDate(date: string | undefined): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new BadRequestException('Cannot book slots in the past');
    }

    return date;
  }

  async bookSlot(userId: string, bookSlotDto: BookSlotDto) {
    try {
      const { slotId, email, answers = [], metadata, schedulingLinkId, date } = bookSlotDto;

      const slotIdRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;
      const match = slotIdRegex.exec(slotId);
      let startTime: string, endTime: string;
      if (match) {
        startTime = match[1];
        endTime = match[2];
      } else {
        throw new BadRequestException('Invalid slotId format');
      }

      if (!email || !this.isValidEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }

      if (date) {
        this.validateDate(date);
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const availableSlots = await this.calendarService.getAvailableSlots(
          user,
          date || new Date().toISOString().split('T')[0],
          9,
          17,
          30,
      );

      const requestedSlot = availableSlots.find(
          (slot) => slot.start === startTime && slot.end === endTime,
      );

      if (!requestedSlot) {
        throw new ConflictException('Requested slot is not available');
      }

      try {
        const event = await this.calendarService.createEvent(
            user,
            startTime,
            endTime,
            email,
            answers,
        );

        const booking = await this.bookingModel.create({
          userId,
          slotId,
          email,
          answers,
          metadata,
          schedulingLinkId,
          eventId: event.id,
          date: date || new Date().toISOString().split('T')[0],
        });

        return {
          bookingId: booking._id,
          eventId: event.id,
          slot: requestedSlot,
        };
      } catch (error) {
        if (error.message.includes('Invalid credentials')) {
          throw new UnauthorizedException('Invalid credentials');
        }
        throw new BadRequestException(error.message);
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
  async createSchedulingLink(createLinkDto: CreateSchedulingLinkDto, userId: string) {
    const { questions, meetingLength, maxDaysInAdvance, startHour, endHour } = createLinkDto;

    if (meetingLength < 15 || meetingLength > 120 || meetingLength % 5 !== 0) {
      throw new BadRequestException('Meeting length must be between 15 and 120 minutes and a multiple of 5');
    }

    if (maxDaysInAdvance < 1 || maxDaysInAdvance > 90) {
      throw new BadRequestException('Max days in advance must be between 1 and 90');
    }

    if (startHour < 0 || startHour > 23 || endHour < startHour || endHour > 24) {
      throw new BadRequestException('Invalid time range');
    }

    if (!questions || questions.length === 0) {
      throw new BadRequestException('At least one question is required');
    }

    const link = await this.schedulingLinkModel.create({
      createdBy: userId,
      questions,
      meetingLength,
      maxDaysInAdvance,
      startHour,
      endHour,
      maxUses: createLinkDto.maxUses || 0,
      uses: 0,
    });

    return {
      linkId: link._id,
      questions: link.questions,
      meetingLength: link.meetingLength,
      maxDaysInAdvance: link.maxDaysInAdvance,
      startHour: link.startHour,
      endHour: link.endHour,
      maxUses: link.maxUses,
    };
  }

  async getAvailableTimesForLink(linkId: string, date: string) {
    const link = await this.schedulingLinkModel.findById(linkId);
    if (!link) {
      throw new BadRequestException('Scheduling link not found');
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new BadRequestException('Scheduling link has expired');
    }

    if (link.maxUses && link.uses >= link.maxUses) {
      throw new BadRequestException('Scheduling link has reached maximum uses');
    }

    this.validateDate(date);

    const user = await this.userModel.findById(link.createdBy);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const availableSlots = await this.calendarService.getAvailableSlots(
        user,
        date,
        link.startHour,
        link.endHour,
        link.meetingLength,
    );

    return availableSlots;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private async getHubSpotContact(email: string): Promise<HubSpotContact | null> {
    try {
      const searchRequest: PublicObjectSearchRequest = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: FilterOperatorEnum.Eq,
                value: email,
              },
            ],
          },
        ],
        sorts: ['createdate'],
        properties: ['email', 'firstname', 'lastname', 'hs_notes_latest'],
        limit: 1,
      };

      const response = await this.hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);
      return response.results[0] || null;
    } catch (error) {
      this.logger.warn(`Failed to fetch HubSpot contact for ${email}: ${error.message}`);
      return null;
    }
  }

  private async getLinkedInContent(linkedInUrl: string): Promise<string> {
    try {
      const scrapingServiceUrl = this.configService.get<string>('LINKEDIN_SCRAPING_SERVICE_URL');
      if (!scrapingServiceUrl) {
        this.logger.warn('LinkedIn scraping service URL not configured');
        return 'Not available';
      }

      const response = await axios.get<string>(scrapingServiceUrl, {
        params: { url: linkedInUrl }
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch LinkedIn content for ${linkedInUrl}: ${error.message}`);
      return 'Not available';
    }
  }

  private async sendNotification(booking: Booking) {
    try {
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      const hubspotContact = await this.getHubSpotContact(booking.email);

      let linkedInContent = 'Not available';
      if (booking.metadata?.linkedInUrl) {
        linkedInContent = await this.getLinkedInContent(booking.metadata.linkedInUrl);
      }

      const augmentedAnswers = booking.answers.map(answer => {
        const hubspotNote = hubspotContact?.properties?.hs_notes_latest || '';
        return `${answer}\nContext: ${hubspotNote || linkedInContent}`;
      }).join('\n');

      await transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: this.configService.get<string>('ADVISOR_EMAIL'),
        subject: 'New Booking Notification',
        text: `New booking from ${booking.email} for ${new Date(booking.slot.start).toLocaleString()}\nLinkedIn: ${booking.metadata?.linkedInUrl || 'Not provided'}\nAnswers:\n${augmentedAnswers}`,
      });

      if (hubspotContact) {
        await this.hubspotClient.crm.objects.notes.basicApi.create({
          properties: {
            hs_note_body: `New booking scheduled for ${new Date(booking.slot.start).toLocaleString()}\nAnswers:\n${augmentedAnswers}`,
            hs_timestamp: new Date().toISOString(),
          },
          associations: [
            {
              to: { id: hubspotContact.id },
              types: [
                {
                  associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                  associationTypeId: 1,
                },
              ],
            },
          ],
        });
      }
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
    }
  }

  async getMeetings(userId: string) {
    const bookings = await this.bookingModel.find({ createdBy: userId }).exec();

    return Promise.all(bookings.map(async booking => {
      const hubspotContact = await this.getHubSpotContact(booking.email);
      let linkedInContent = 'Not available';

      if (booking.metadata?.linkedInUrl) {
        linkedInContent = await this.getLinkedInContent(booking.metadata.linkedInUrl);
      }

      const augmentedNotes = booking.answers.map(answer => {
        const hubspotNote = hubspotContact?.properties?.hs_notes_latest || '';
        return `${answer}\nContext: ${hubspotNote || linkedInContent}`;
      }).join('\n');

      return {
        ...booking.toObject(),
        augmentedNotes,
        hubspotContact: hubspotContact ? {
          id: hubspotContact.id,
          properties: hubspotContact.properties,
        } : null,
      };
    }));
  }

  async getGoogleCalendarEvents(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.accessToken) {
      throw new Error('Google access token not found for user');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return res.data.items;
  }
}