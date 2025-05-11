import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AdvisorDashboard from './AdvisorDashboard';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock child components
jest.mock('../components/Scheduling/SchedulingWindowForm', () => () => (
  <div data-testid="scheduling-window-form">Scheduling Window Form</div>
));

jest.mock('../components/Scheduling/SchedulingLinkForm', () => () => (
  <div data-testid="scheduling-link-form">Scheduling Link Form</div>
));

jest.mock('../components/Dashboard/MeetingList', () => () => (
  <div data-testid="meeting-list">Meeting List</div>
));

const TestComponent = () => {
  const { setGoogleToken } = useAuth();
  React.useEffect(() => {
    setGoogleToken('test-token');
  }, [setGoogleToken]);
  return <AdvisorDashboard />;
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </AuthProvider>
  );
};

describe('AdvisorDashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows login prompt when not authenticated', async () => {
    renderWithRouter(<AdvisorDashboard />);
    
    expect(screen.getByText(/Please log in with Google to access the dashboard/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders forms and meeting list when authenticated', async () => {
    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('scheduling-window-form')).toBeInTheDocument();
      expect(screen.getByTestId('scheduling-link-form')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-list')).toBeInTheDocument();
    });
  });
}); 