import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { CalendarService } from '../calendar/calendar.service';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { Client } from '@hubspot/api-client';

@Injectable()
export class SchedulingService {
  private links: Map<string, any> = new Map();
  private bookings: Map<string, any> = new Map();
  private hubspotClient: Client;

  constructor(private readonly calendarService: CalendarService) {
    this.hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  }

  async bookSlot(accessToken: string, bookSlotDto: BookSlotDto) {
    try {
      // Check if slot is still available
      const availableSlots = await this.calendarService.getAvailableSlots(
        accessToken,
        new Date().toISOString().split('T')[0],
        9,
        17,
        30,
      );

      const slot = availableSlots.find((s) => s.id === bookSlotDto.slotId);
      if (!slot) {
        throw new ConflictException('Slot is no longer available');
      }

      // Create calendar event
      const event = await this.calendarService.createEvent(
        accessToken,
        slot.start,
        slot.end,
        bookSlotDto.email,
        bookSlotDto.answers,
      );

      // Store booking
      const bookingId = uuidv4();
      const booking = {
        id: bookingId,
        slotId: bookSlotDto.slotId,
        email: bookSlotDto.email,
        answers: bookSlotDto.answers,
        eventId: event.id,
        slot,
        createdAt: new Date(),
      };
      this.bookings.set(bookingId, booking);

      // Send notifications
      await this.sendNotification(booking);

      return {
        bookingId,
        eventId: event.id,
        slot,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to book slot');
    }
  }

  async createSchedulingLink(createLinkDto: CreateSchedulingLinkDto) {
    // Validate meeting length
    if (createLinkDto.meetingLength < 15 || createLinkDto.meetingLength > 480) {
      throw new BadRequestException('Meeting length must be between 15 and 480 minutes');
    }

    const link = {
      id: uuidv4(),
      ...createLinkDto,
      createdAt: new Date(),
      uses: 0,
    };

    this.links.set(link.id, link);
    return link;
  }

  async getAvailableTimesForLink(linkId: string, date: string) {
    const link = this.links.get(linkId);
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

    // Get available slots from calendar service
    const slots = await this.calendarService.getAvailableSlots(
      process.env.GOOGLE_ACCESS_TOKEN,
      date,
      9,
      17,
      link.meetingLength,
    );

    return slots;
  }

  private async sendNotification(booking: any) {
    // Send email notification
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADVISOR_EMAIL,
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
                associationCategory: 'HUBSPOT_DEFINED',
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
  }
} 