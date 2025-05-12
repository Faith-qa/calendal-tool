import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import BookingForm from './BookingForm';
import { mockedAxios } from '../../setupTests';

describe('BookingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(
      <AuthProvider>
        <BookingForm linkId="test-link" slotId="1" />
      </AuthProvider>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('LinkedIn URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Book Meeting')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <BookingForm linkId="test-link" slotId="1" />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('LinkedIn URL'), { target: { value: 'https://linkedin.com/in/test' } });
    fireEvent.change(screen.getByPlaceholderText('Answer 1'), { target: { value: 'Test answer' } });
    fireEvent.click(screen.getByText('Book Meeting'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/scheduling/book', {
        slotId: '1',
        email: 'test@example.com',
        answers: ['Test answer'],
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        schedulingLinkId: 'test-link',
        metadata: { linkedInUrl: 'https://linkedin.com/in/test' },
      });
    });
  });

  it('handles submission error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Failed to book'));

    render(
      <AuthProvider>
        <BookingForm linkId="test-link" slotId="1" />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('LinkedIn URL'), { target: { value: 'https://linkedin.com/in/test' } });
    fireEvent.click(screen.getByText('Book Meeting'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to book meeting');
    });
  });
}); 