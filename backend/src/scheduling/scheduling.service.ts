import { Injectable, BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class SchedulingService {
  private hubspotClient: Client;
  private readonly defaultStartHour = 9;
  private readonly defaultEndHour = 17;
  private readonly defaultSlotDuration = 30;

  constructor(
    private readonly calendarService: CalendarService,
    @InjectModel(SchedulingLink.name) private schedulingLinkModel: Model<SchedulingLink>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.validateEnvironmentVariables();
    this.hubspotClient = new Client({ accessToken: this.configService.get<string>('HUBSPOT_ACCESS_TOKEN') });
  }

  private validateEnvironmentVariables() {
    // Skip validation in test environment
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

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new BadRequestException('Scheduling link has expired');
    }

    // Check max uses
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
      const { slotId, email, answers, metadata, schedulingLinkId, date } = bookSlotDto;

      // Robustly extract startTime and endTime from slotId (format: 'startISO-endISO')
      // Use regex to match two ISO strings separated by a single '-'
      const slotIdRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;
      const match = slotIdRegex.exec(slotId);
      let startTime: string, endTime: string;
      if (match) {
        startTime = match[1];
        endTime = match[2];
      } else {
        throw new BadRequestException('Invalid slotId format');
      }

      // Validate email
      if (!email || !this.isValidEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Validate date if provided
      if (date) {
        this.validateDate(date);
      }

      // Get available slots for the date
      const availableSlots = await this.calendarService.getAvailableSlots(
        userId,
        date || new Date().toISOString().split('T')[0],
        9, // Default start hour
        17, // Default end hour
        30, // Default slot duration
        'UTC' // Default timezone
      );

      // Check if the requested slot is available
      const requestedSlot = availableSlots.find(
        (slot) => slot.start === startTime && slot.end === endTime,
      );

      if (!requestedSlot) {
        throw new ConflictException('Requested slot is not available');
      }

      // Create calendar event
      try {
        const event = await this.calendarService.createEvent(
          userId,
          startTime,
          endTime,
          email,
          answers,
          'UTC'
        );

        // Create booking record
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

    // Validate meeting length
    if (meetingLength < 15 || meetingLength > 120 || meetingLength % 5 !== 0) {
      throw new BadRequestException('Meeting length must be between 15 and 120 minutes and a multiple of 5');
    }

    // Validate max days in advance
    if (maxDaysInAdvance < 1 || maxDaysInAdvance > 90) {
      throw new BadRequestException('Max days in advance must be between 1 and 90');
    }

    // Validate time range
    if (startHour < 0 || startHour > 23 || endHour < startHour || endHour > 24) {
      throw new BadRequestException('Invalid time range');
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      throw new BadRequestException('At least one question is required');
    }

    // Create scheduling link
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
    // Find scheduling link first
    const link = await this.schedulingLinkModel.findById(linkId);
    if (!link) {
      throw new BadRequestException('Scheduling link not found');
    }

    // Check if link has expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new BadRequestException('Scheduling link has expired');
    }

    // Check if link has reached max uses
    if (link.maxUses && link.uses >= link.maxUses) {
      throw new BadRequestException('Scheduling link has reached maximum uses');
    }

    // Validate date format after link validation
    this.validateDate(date);

    // Get available slots
    const availableSlots = await this.calendarService.getAvailableSlots(
      link.createdBy,
      date,
      link.startHour,
      link.endHour,
      link.meetingLength,
      'UTC' // Default timezone
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

  private async sendNotification(booking: Booking) {
    try {
      // Send email notification
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
        secure: true,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: this.configService.get<string>('ADVISOR_EMAIL'),
        subject: 'New Booking Notification',
        text: `New booking from ${booking.email} for ${new Date(booking.slot.start).toLocaleString()}`,
      });

      // Update HubSpot contact
      try {
        const contact = await this.hubspotClient.crm.contacts.basicApi.create({
          properties: {
            email: booking.email,
            firstname: booking.email.split('@')[0],
            lastname: '',
          },
        });

        // Create a note about the booking
        await this.hubspotClient.crm.objects.notes.basicApi.create({
          properties: {
            hs_note_body: `Booking scheduled for ${new Date(booking.slot.start).toLocaleString()}`,
            hs_timestamp: new Date().toISOString(),
          },
          associations: [
            {
              to: { id: contact.id },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED' as any,
                  associationTypeId: 1,
                },
              ],
            },
          ],
        });
      } catch (error) {
        // Log error but don't fail the booking
        console.error('Failed to update HubSpot:', error);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw the error as notification failure shouldn't affect the booking
    }
  }
} 