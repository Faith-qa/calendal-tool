import React from 'react';
import { render, screen } from '@testing-library/react';
import MeetingList from '../MeetingList';

describe('MeetingList', () => {
  const mockMeetings = [
    {
      id: '1',
      email: 'test@example.com',
      startTime: '5/11/2025, 12:00:00 PM',
      endTime: '1:00:00 PM',
      answers: 'Test answer',
      augmentedNotes: 'Test notes'
    }
  ];

  it('renders meeting list', async () => {
    render(<MeetingList meetings={mockMeetings} />);
    
    expect(screen.getByText('Scheduled Meetings')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/5\/11\/2025, 12:00:00 PM/)).toBeInTheDocument();
    expect(screen.getByText(/1:00:00 PM/)).toBeInTheDocument();
    expect(screen.getByText('Test answer')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('renders empty state when no meetings', () => {
    render(<MeetingList meetings={[]} />);
    
    expect(screen.getByText('Scheduled Meetings')).toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });
}); 