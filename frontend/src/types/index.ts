export interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

export interface Meeting {
  _id: string;
  email: string;
  answers: string[];
  augmentedNotes?: string;
  slot: {
    start: string;
    end: string;
  };
}

export interface User {
  _id: string;
  email: string;
  name: string;
  googleTokens: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface HubSpotResponse {
  accessToken: string;
}

export interface SchedulingWindow {
  startHour: number;
  endHour: number;
  weekday: string;
}

export interface SchedulingLink {
  meetingLength: number;
  maxDaysInAdvance: number;
  questions: string[];
  maxUses?: number;
  expiresAt?: string;
  startHour: number;
  endHour: number;
}

export interface BookingRequest {
  slotId: string;
  email: string;
  answers: string[];
  metadata: {
    linkedInUrl: string;
  };
  schedulingLinkId: string;
  date: string;
} 