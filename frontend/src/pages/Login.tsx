import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { googleToken } = useAuth();

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
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
};

export default Login; 