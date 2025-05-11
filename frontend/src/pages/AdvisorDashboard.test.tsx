import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AdvisorDashboard from './AdvisorDashboard';

describe('AdvisorDashboard', () => {
  it('shows login prompt when not authenticated', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AdvisorDashboard />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Please log in with Google')).toBeInTheDocument();
  });

  it('renders forms and meeting list when authenticated', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AdvisorDashboard />
        </AuthProvider>
      </MemoryRouter>
    );
    const auth = useAuth();
    auth.setGoogleToken('test-token');
    expect(screen.getByText('Create Scheduling Window')).toBeInTheDocument();
    expect(screen.getByText('Create Scheduling Link')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Meetings')).toBeInTheDocument();
  });
}); 