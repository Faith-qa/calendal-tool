import React, { Dispatch, SetStateAction } from 'react';

// Define the props interface
interface GoogleLoginButtonProps {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  loading: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ setLoading, setError, loading }) => {
  const handleLogin = () => {
    setLoading(true);
    setError(null);
    try {
      // Use browser redirect instead of fetch to avoid CORS issue
      window.location.href = 'http://localhost:3000/api/auth/google';
    } catch (error) {
      console.error('Google login redirect error:', error);
      setError('Failed to redirect for sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
      <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
      >
        {loading ? 'Redirecting...' : 'Sign in with Google'}
      </button>
  );
};

export default GoogleLoginButton;