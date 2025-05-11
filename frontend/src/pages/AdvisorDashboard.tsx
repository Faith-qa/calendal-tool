import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SchedulingWindowForm from '../components/Scheduling/SchedulingWindowForm';
import SchedulingLinkForm from '../components/Scheduling/SchedulingLinkForm';
import MeetingList from '../components/Dashboard/MeetingList';

const AdvisorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { googleToken } = useAuth();

  if (!googleToken) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Advisor Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <SchedulingWindowForm />
            <SchedulingLinkForm />
          </div>
          <div>
            <MeetingList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard; 