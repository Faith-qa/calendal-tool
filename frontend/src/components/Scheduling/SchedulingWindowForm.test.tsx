import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import SchedulingWindowForm from './SchedulingWindowForm';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  post: jest.fn(),
}));

describe('SchedulingWindowForm', () => {
  const mockPost = api.post as jest.Mock;

  beforeEach(() => {
    mockPost.mockClear();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders form fields', () => {
    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create window/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1 } });
    
    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/start time/i), '09:00');
      await userEvent.type(screen.getByLabelText(/end time/i), '17:00');
    });
    
    // Submit the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create window/i }));
    });
    
    // Wait for the API call and success message
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/scheduling/windows', {
        startTime: '09:00',
        endTime: '17:00',
      });
      expect(window.alert).toHaveBeenCalledWith('Scheduling window created');
    });
  });

  it('handles submission error', async () => {
    const errorMessage = 'Failed to create window';
    mockPost.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/start time/i), '09:00');
      await userEvent.type(screen.getByLabelText(/end time/i), '17:00');
    });
    
    // Submit the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create window/i }));
    });
    
    // Wait for the error message
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to create scheduling window');
    });
  });

  it('shows validation errors for invalid times', async () => {
    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    
    // Submit without filling the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create window/i }));
    });
    
    // Check for required field errors
    expect(await screen.findByText('Start time is required')).toBeInTheDocument();
    expect(await screen.findByText('End time is required')).toBeInTheDocument();
    
    // Fill with invalid times (end before start)
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/start time/i), '17:00');
      await userEvent.type(screen.getByLabelText(/end time/i), '09:00');
    });
    
    // Submit again
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create window/i }));
    });
    
    // Check for time validation error
    expect(await screen.findByText('End time must be after start time')).toBeInTheDocument();
  });
}); 