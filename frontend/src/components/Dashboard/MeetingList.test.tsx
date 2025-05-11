import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import MeetingList from './MeetingList';
import { mockedAxios } from '../../setupTests';

describe('MeetingList', () => {
  const mockMeetings = [
    {
      _id: '1',
      email: 'test@example.com',
      slot: { start: '2025-05-11T09:00:00Z', end: '2025-05-11T10:00:00Z' },
      answers: ['Test answer'],
      augmentedNotes: 'Test notes',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meeting list', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockMeetings });

    render(
      <AuthProvider>
        <MeetingList />
      </AuthProvider>
    );

    expect(await screen.findByText('Scheduled Meetings')).toBeInTheDocument();
    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    expect(await screen.findByText('5/11/2025, 9:00:00 AM - 10:00:00 AM')).toBeInTheDocument();
    expect(await screen.findByText('Test answer')).toBeInTheDocument();
    expect(await screen.findByText('Test notes')).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <AuthProvider>
        <MeetingList />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to fetch meetings');
    });
  });
}); 