import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { useAuth } from './contexts/AuthContext';

// Mock the entire AuthContext module
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));

describe('App', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseAuth.mockReturnValue({
      googleToken: null,
      hubspotToken: null,
      setGoogleToken: jest.fn(),
      setHubspotToken: jest.fn(),
      loginWithGoogle: jest.fn(),
    });
  });

  it('renders Login page by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Advisor Scheduling')).toBeInTheDocument();
    });
  });

  it('renders AdvisorDashboard when authenticated and on /dashboard', async () => {
    mockUseAuth.mockReturnValue({
      googleToken: 'test-token',
      hubspotToken: null,
      setGoogleToken: jest.fn(),
      setHubspotToken: jest.fn(),
      loginWithGoogle: jest.fn(),
    });

    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Advisor Dashboard')).toBeInTheDocument();
    });
  });

  it('renders ScheduleMeeting on /schedule/:linkId', async () => {
    window.history.pushState({}, '', '/schedule/test-link');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Schedule a Meeting')).toBeInTheDocument();
    });
  });

  it('redirects to login when accessing dashboard without authentication', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Advisor Scheduling')).toBeInTheDocument();
    });
  });
});
