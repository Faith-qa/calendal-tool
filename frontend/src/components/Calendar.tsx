import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import './Calendar.css';

interface TimeSlot {
  start: string;
  end: string;
}

interface CalendarProps {
  date: string;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  timeZone?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  date,
  startHour = 9,
  endHour = 17,
  slotDuration = 30,
  timeZone = 'UTC',
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<TimeSlot[]>('/api/calendar/slots', {
          params: {
            date,
            startHour,
            endHour,
            slotDuration,
            timeZone,
          },
        });
        setSlots(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch available slots');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date, startHour, endHour, slotDuration, timeZone]);

  const formatTime = (isoString: string) => {
    return formatInTimeZone(parseISO(isoString), 'UTC', 'h:mm a');
  };

  if (loading) {
    return <div>Loading available slots...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="calendar">
      <h2>Available Slots for {format(parseISO(date), 'MMMM d, yyyy')}</h2>
      {slots.length === 0 ? (
        <p>No available slots found for this date.</p>
      ) : (
        <div className="slots-grid">
          {slots.map((slot, index) => (
            <div key={index} className="slot">
              {formatTime(slot.start)} - {formatTime(slot.end)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 