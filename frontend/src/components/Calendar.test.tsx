import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Calendar } from './Calendar';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Calendar', () => {
  const mockDate = '2024-03-20';
  const mockSlots = [
    { start: '2024-03-20T09:00:00Z', end: '2024-03-20T09:30:00Z' },
    { start: '2024-03-20T09:30:00Z', end: '2024-03-20T10:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (axios.get as any).mockImplementation(() => new Promise(() => {}));
    render(<Calendar date={mockDate} />);
    expect(screen.getByText('Loading available slots...')).toBeInTheDocument();
  });

  it('renders available slots when data is fetched successfully', async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: mockSlots,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
    render(<Calendar date={mockDate} />);

    await waitFor(() => {
      expect(screen.getByText('Available Slots for March 20, 2024')).toBeInTheDocument();
      expect(screen.getByText(/9:00 AM\s*-\s*9:30 AM/)).toBeInTheDocument();
      expect(screen.getByText(/9:30 AM\s*-\s*10:00 AM/)).toBeInTheDocument();
    });
  });

  it('renders error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch slots';
    (axios.get as any).mockRejectedValueOnce({ response: { data: { message: errorMessage } } });
    render(<Calendar date={mockDate} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renders no slots message when empty array is returned', async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
    render(<Calendar date={mockDate} />);

    await waitFor(() => {
      expect(screen.getByText('No available slots found for this date.')).toBeInTheDocument();
    });
  });

  it('passes correct parameters to API', async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: mockSlots,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
    render(
      <Calendar
        date={mockDate}
        startHour={10}
        endHour={18}
        slotDuration={45}
        timeZone="America/New_York"
      />
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/calendar/slots', {
        params: {
          date: mockDate,
          startHour: 10,
          endHour: 18,
          slotDuration: 45,
          timeZone: 'America/New_York',
        },
      });
    });
  });
}); 