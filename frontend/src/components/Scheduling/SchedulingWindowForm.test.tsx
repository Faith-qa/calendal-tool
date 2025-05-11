import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import SchedulingWindowForm from './SchedulingWindowForm';
import api from '../../services/api';

jest.mock('../../services/api');

describe('SchedulingWindowForm', () => {
  it('renders form fields', () => {
    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    expect(screen.getByPlaceholderText('Start Hour')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('End Hour')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Create Window')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockPost = jest.fn().mockResolvedValue({});
    (api.post as jest.Mock).mockImplementation(mockPost);
    window.alert = jest.fn();

    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Start Hour'), { target: { value: '9' } });
    fireEvent.change(screen.getByPlaceholderText('End Hour'), { target: { value: '17' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Monday' } });
    fireEvent.click(screen.getByText('Create Window'));
    expect(mockPost).toHaveBeenCalledWith('/scheduling/windows', {
      startHour: 9,
      endHour: 17,
      weekday: 'Monday',
    });
    expect(window.alert).toHaveBeenCalledWith('Scheduling window created');
  });

  it('handles submission error', async () => {
    const mockPost = jest.fn().mockRejectedValue(new Error('Failed'));
    (api.post as jest.Mock).mockImplementation(mockPost);
    window.alert = jest.fn();

    render(
      <AuthProvider>
        <SchedulingWindowForm />
      </AuthProvider>
    );
    fireEvent.change(screen.getByPlaceholderText('Start Hour'), { target: { value: '9' } });
    fireEvent.change(screen.getByPlaceholderText('End Hour'), { target: { value: '17' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Monday' } });
    fireEvent.click(screen.getByText('Create Window'));
    expect(window.alert).toHaveBeenCalledWith('Failed to create scheduling window');
  });
}); 