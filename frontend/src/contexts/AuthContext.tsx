import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

interface AuthState {
  googleToken: string | null;
  hubspotToken: string | null;
  setGoogleToken: (token: string | null) => void;
  setHubspotToken: (token: string | null) => void;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [hubspotToken, setHubspotToken] = useState<string | null>(null);

  const loginWithGoogle = useCallback(async () => {
    try {
      const response = await api.get('/auth/google');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      alert('Failed to initiate Google login');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ googleToken, hubspotToken, setGoogleToken, setHubspotToken, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 