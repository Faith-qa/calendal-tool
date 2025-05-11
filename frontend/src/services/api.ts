import axios from 'axios';
import { AuthResponse, HubSpotResponse, TimeSlot, Meeting, SchedulingWindow, SchedulingLink, BookingRequest } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const googleLogin = async (): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google');
  return response.data;
};

export const hubspotConnect = async (): Promise<HubSpotResponse> => {
  const response = await api.post<HubSpotResponse>('/auth/hubspot');
  return response.data;
};

export const createSchedulingWindow = async (window: SchedulingWindow): Promise<void> => {
  await api.post('/scheduling/windows', window);
};

export const createSchedulingLink = async (link: SchedulingLink): Promise<void> => {
  await api.post('/scheduling/links', link);
};

export const getAvailableTimes = async (linkId: string, date: string): Promise<TimeSlot[]> => {
  const response = await api.get<TimeSlot[]>(`/scheduling/links/${linkId}/times`, {
    params: { date },
  });
  return response.data;
};

export const bookSlot = async (booking: BookingRequest): Promise<void> => {
  await api.post('/scheduling/book', booking);
};

export const getMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get<Meeting[]>('/scheduling/meetings');
  return response.data;
};

export default api; 