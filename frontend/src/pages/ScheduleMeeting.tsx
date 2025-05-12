import { useParams } from 'react-router-dom';
import AvailableTimes from '../components/Scheduling/AvailableTimes';

const ScheduleMeeting: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Schedule a Meeting</h1>
        <AvailableTimes linkId={linkId} date={today} />
      </div>
    </div>
  );
};

export default ScheduleMeeting; 