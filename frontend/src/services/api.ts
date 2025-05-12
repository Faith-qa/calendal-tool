import axios from 'axios';
import { AuthResponse, HubSpotResponse, TimeSlot, Meeting, SchedulingWindow, SchedulingLink, BookingRequest } from '../types';
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Add a request interceptor to include the token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

console.log(api)
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