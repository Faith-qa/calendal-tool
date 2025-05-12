import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; // Add useEffect and useState
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { googleToken, setGoogleToken } = useAuth(); // Ensure setGoogleToken is available from useAuth
  const [error, setError] = useState<string | null>(null); // Add error state
  const [loading, setLoading] = useState(false); // Add loading state

  // Check for token in URL after OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authError = urlParams.get('error');
    if (token) {
      setGoogleToken(token);
      // Clear URL parameters to avoid reprocessing
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/dashboard');
    } else if (authError) {
      setError('Failed to sign in with Google. Please try again.');
    }
  }, [navigate, setGoogleToken]);

  // Redirect to dashboard if already authenticated
  if (googleToken) {
    navigate('/dashboard');
    return null;
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Advisor Scheduling
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to manage your scheduling
            </p>
          </div>
          <div className="mt-8 space-y-6">
            {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
            )}
            <GoogleLoginButton setLoading={setLoading} setError={setError} loading={loading} />
          </div>
        </div>
      </div>
  );
};

export default Login;