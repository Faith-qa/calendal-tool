import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
}

const MeetingList: React.FC = () => {
  const { googleToken } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        console.log('MeetingList fetching meetings with token:', googleToken); // Add this log
        if (!googleToken) {
          throw new Error('Not authenticated. Please sign in.');
        }

        const response = await api.get('/meetings', {
          headers: {
            Authorization: `Bearer ${googleToken}`,
          },
        });

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format from server');
        }

        setMeetings(response.data);
        setLoading(false);
      } catch (err:any) {
        console.error('Failed to fetch meetings:', err);
        setError(err.message || 'Failed to load meetings. Please try again.');
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [googleToken]);

  if (loading) return <div className="text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Scheduled Meetings</h2>
        {meetings.length === 0 ? (
            <p className="text-gray-600">No meetings scheduled.</p>
        ) : (
            <ul className="divide-y divide-gray-200">
              {meetings.map((meeting) => (
                  <li key={meeting.id} className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meeting.title || 'Untitled Event'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(meeting.startTime).toLocaleString()} - {new Date(meeting.endTime).toLocaleString()}
                        </p>
                        {meeting.description && (
                            <p className="text-sm text-gray-500">{meeting.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
};

export default MeetingList;