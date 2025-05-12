import { createContext, useContext, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

interface GoogleAccount {
  email: string;
  accessToken: string;
  refreshToken?: string;
}

interface HubSpotAccount {
  email: string;
  accessToken: string;
  refreshToken?: string;
}

interface AuthContextType {
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
  user: { id: string; email: string; name: string; googleAccounts?: GoogleAccount[]; hubspotAccounts?: HubSpotAccount[] } | null;
  signOut: () => void; // Add signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string; googleAccounts?: GoogleAccount[]; hubspotAccounts?: HubSpotAccount[] } | null>(null);

  const setToken = (token: string | null) => {
    setGoogleToken(token);
    if (token) {
      try {
        const decoded: { sub: string; email: string; name: string; googleAccounts?: GoogleAccount[]; hubspotAccounts?: HubSpotAccount[] } = jwtDecode(token);
        setUser({ id: decoded.sub, email: decoded.email, name: decoded.name, googleAccounts: decoded.googleAccounts, hubspotAccounts: decoded.hubspotAccounts });
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const signOut = () => {
    setGoogleToken(null);
    setUser(null);
    navigate('/');
  };

  return (
      <AuthContext.Provider value={{ googleToken, setGoogleToken: setToken, user, signOut }}>
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