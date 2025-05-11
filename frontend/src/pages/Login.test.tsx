import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from './Login';

// Mock the GoogleLoginButton component
jest.mock('../components/Auth/GoogleLoginButton', () => {
  return function MockGoogleLoginButton() {
    return <button>Sign in with Google</button>;
  };
});

describe('Login', () => {
  it('renders login page when not authenticated', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Advisor Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Sign in to manage your scheduling')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('navigates to dashboard when authenticated', async () => {
    const TestComponent = () => {
      const { setGoogleToken } = useAuth();
      React.useEffect(() => {
        setGoogleToken('test-token');
      }, [setGoogleToken]);
      return <Login />;
    };

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Advisor Scheduling')).not.toBeInTheDocument();
    });
  });
}); 