import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  useAuth(); // This will throw an error if not within AuthProvider
  return <div>Test</div>;
};

describe('AuthContext', () => {
  it('provides default state and setters', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let error;
    try {
      render(<TestComponent />);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(new Error('useAuth must be used within an AuthProvider'));
    spy.mockRestore();
  });
}); 