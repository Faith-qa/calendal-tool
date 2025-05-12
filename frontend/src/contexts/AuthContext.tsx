import { createContext, useContext, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Change to named import

interface AuthContextType {
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
  user: { id: string; email: string; name: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  const setToken = (token: string | null) => {
    setGoogleToken(token);
    if (token) {
      try {
        const decoded: { sub: string; email: string; name: string } = jwtDecode(token);
        setUser({ id: decoded.sub, email: decoded.email, name: decoded.name });
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  return (
      <AuthContext.Provider value={{ googleToken, setGoogleToken: setToken, user }}>
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