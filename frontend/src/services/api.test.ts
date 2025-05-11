import axios from 'axios';
import api, { setAuthToken } from './api';
import { AuthResponse, HubSpotResponse, TimeSlot, Meeting } from '../types';
import { mockedAxios } from '../setupTests';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets auth token', () => {
    setAuthToken('test-token');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');

    setAuthToken(null);
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('makes GET request', async () => {
    const mockResponse = { data: { message: 'success' } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const response = await api.get('/test');
    expect(mockedAxios.get).toHaveBeenCalledWith('/test');
    expect(response).toEqual(mockResponse);
  });

  it('makes POST request', async () => {
    const mockData = { name: 'test' };
    const mockResponse = { data: { message: 'success' } };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const response = await api.post('/test', mockData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/test', mockData);
    expect(response).toEqual(mockResponse);
  });

  it('handles errors', async () => {
    const mockError = new Error('Network error');
    mockedAxios.get.mockRejectedValueOnce(mockError);

    await expect(api.get('/test')).rejects.toThrow('Network error');
  });

  it('makes a POST request to /auth/google', async () => {
    const mockResponse: AuthResponse = {
      user: {
        _id: '123',
        email: 'test@example.com',
        name: 'Test User',
        googleTokens: ['token1'],
      },
      token: 'jwt-token',
    };

    jest.spyOn(api, 'post').mockResolvedValueOnce({ data: mockResponse });

    const response = await api.post<AuthResponse>('/auth/google');
    expect(response.data).toEqual(mockResponse);
    expect(api.post).toHaveBeenCalledWith('/auth/google');
  });

  it('makes a POST request to /auth/hubspot', async () => {
    const mockResponse: HubSpotResponse = {
      accessToken: 'hubspot-token',
    };

    jest.spyOn(api, 'post').mockResolvedValueOnce({ data: mockResponse });

    const response = await api.post<HubSpotResponse>('/auth/hubspot');
    expect(response.data).toEqual(mockResponse);
    expect(api.post).toHaveBeenCalledWith('/auth/hubspot');
  });

  it('makes a GET request to /scheduling/meetings', async () => {
    const mockMeetings: Meeting[] = [
      {
        _id: '1',
        email: 'test@example.com',
        answers: ['answer1'],
        augmentedNotes: 'notes',
        slot: { start: '2024-05-11T10:00:00Z', end: '2024-05-11T11:00:00Z' },
      },
    ];

    jest.spyOn(api, 'get').mockResolvedValueOnce({ data: mockMeetings });

    const response = await api.get<Meeting[]>('/scheduling/meetings');
    expect(response.data).toEqual(mockMeetings);
    expect(api.get).toHaveBeenCalledWith('/scheduling/meetings');
  });
}); 