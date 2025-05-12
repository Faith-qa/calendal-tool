import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ScheduleMeeting from './ScheduleMeeting';
import api from '../services/api';

jest.mock('../services/api');

describe('ScheduleMeeting', () => {
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

  it('renders available times with valid linkId', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: mockSlots });
    (api.get as jest.Mock).mockImplementation(mockGet);

    render(
      <MemoryRouter initialEntries={['/schedule/test-link']}>
        <AuthProvider>
          <Routes>
            <Route path="/schedule/:linkId" element={<ScheduleMeeting />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Schedule a Meeting')).toBeInTheDocument();
    
    const today = new Date().toISOString().split('T')[0];
    await waitFor(() => {
      expect(screen.getByText(`Available Times on ${today}`)).toBeInTheDocument();
    });
  });

  it('uses current date when no date param', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: mockSlots });
    (api.get as jest.Mock).mockImplementation(mockGet);

    render(
      <MemoryRouter initialEntries={['/schedule/test-link']}>
        <AuthProvider>
          <Routes>
            <Route path="/schedule/:linkId" element={<ScheduleMeeting />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const today = new Date().toISOString().split('T')[0];
    
    await waitFor(() => {
      expect(screen.getByText(`Available Times on ${today}`)).toBeInTheDocument();
    });
  });
}); 