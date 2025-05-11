import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import AvailableTimes from './AvailableTimes';
import api from '../../services/api';

jest.mock('../../services/api');

describe('AvailableTimes', () => {
  const mockSlots = [
    { 
      id: '1', 
      start: '2025-05-11T09:00:00Z', 
      end: '2025-05-11T10:00:00Z',
      duration: 60
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.toLocaleTimeString to return consistent format
    jest.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => '9:00:00 AM');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders available times', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: mockSlots });
    (api.get as jest.Mock).mockImplementation(mockGet);

    render(
      <MemoryRouter initialEntries={['/schedule/test-link']}>
        <AuthProvider>
          <AvailableTimes linkId="test-link" date="2025-05-11" />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the title to appear
    await waitFor(() => {
      expect(screen.getByText('Available Times on 2025-05-11')).toBeInTheDocument();
    });

    // Wait for the time slot to appear
    await waitFor(() => {
      expect(screen.getByText('9:00:00 AM - 9:00:00 AM')).toBeInTheDocument();
    });
  });

  it('shows booking form when slot selected', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: mockSlots });
    (api.get as jest.Mock).mockImplementation(mockGet);

    render(
      <MemoryRouter initialEntries={['/schedule/test-link']}>
        <AuthProvider>
          <AvailableTimes linkId="test-link" date="2025-05-11" />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the time slot to appear
    await waitFor(() => {
      expect(screen.getByText('9:00:00 AM - 9:00:00 AM')).toBeInTheDocument();
    });

    // Click the time slot
    fireEvent.click(screen.getByText('9:00:00 AM - 9:00:00 AM'));
    
    // Check for booking form
    expect(screen.getByText('Book Your Slot')).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('Failed'));
    (api.get as jest.Mock).mockImplementation(mockGet);
    window.alert = jest.fn();

    render(
      <MemoryRouter initialEntries={['/schedule/test-link']}>
        <AuthProvider>
          <AvailableTimes linkId="test-link" date="2025-05-11" />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to fetch available times');
    });
  });
}); 