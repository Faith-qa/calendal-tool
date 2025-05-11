import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Create a test component that uses the auth context
const TestComponent = () => {
  const { googleToken, setGoogleToken, hubspotToken, setHubspotToken } = useAuth();
  return (
    <div>
      <div data-testid="googleToken">{googleToken || 'no google token'}</div>
      <div data-testid="hubspotToken">{hubspotToken || 'no hubspot token'}</div>
      <button onClick={() => setGoogleToken('test-google-token')}>Set Google Token</button>
      <button onClick={() => setHubspotToken('test-hubspot-token')}>Set Hubspot Token</button>
    </div>
  );
};

describe('AuthContext', () => {
  it('provides default state and setters', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('googleToken')).toHaveTextContent('no google token');
    expect(screen.getByTestId('hubspotToken')).toHaveTextContent('no hubspot token');
  });

  it('updates state when setters are called', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Set Google Token').click();
    });
    expect(screen.getByTestId('googleToken')).toHaveTextContent('test-google-token');

    await act(async () => {
      screen.getByText('Set Hubspot Token').click();
    });
    expect(screen.getByTestId('hubspotToken')).toHaveTextContent('test-hubspot-token');
  });

  it('throws error when used outside provider', () => {
    let error;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch('useAuth must be used within an AuthProvider');
  });
}); 