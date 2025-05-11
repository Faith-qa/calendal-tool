import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import SchedulingLinkForm from './SchedulingLinkForm';
import { mockedAxios } from '../../setupTests';

describe('SchedulingLinkForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(
      <AuthProvider>
        <SchedulingLinkForm />
      </AuthProvider>
    );
    expect(screen.getByPlaceholderText('Link Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Create Link')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <SchedulingLinkForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Link Name'), { target: { value: 'Test Link' } });
    fireEvent.change(screen.getByPlaceholderText('Duration (minutes)'), { target: { value: '30' } });
    fireEvent.change(screen.getByPlaceholderText('Question 1'), { target: { value: 'Test question' } });
    fireEvent.click(screen.getByText('Create Link'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/scheduling/links', {
        name: 'Test Link',
        duration: '30',
        questions: ['Test question'],
      });
    });
  });

  it('handles submission error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Failed to create'));

    render(
      <AuthProvider>
        <SchedulingLinkForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Link Name'), { target: { value: 'Test Link' } });
    fireEvent.change(screen.getByPlaceholderText('Duration (minutes)'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('Create Link'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to create scheduling link');
    });
  });
}); 