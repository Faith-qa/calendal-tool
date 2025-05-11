import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Meeting } from '../../types';

const MeetingList: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/scheduling/meetings');
        setMeetings(res.data);
      } catch (error) {
        alert('Failed to fetch meetings');
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div>
      <h2 className="text-xl mb-2">Scheduled Meetings</h2>
      {meetings.map(meeting => (
        <div key={meeting._id} className="border p-4 mb-2 rounded">
          <p><strong>Email:</strong> {meeting.email}</p>
          <p><strong>Time:</strong> {new Date(meeting.slot.start).toLocaleString()} - {new Date(meeting.slot.end).toLocaleTimeString()}</p>
          <p><strong>Answers:</strong> {meeting.answers.join(', ')}</p>
          <p><strong>Augmented Notes:</strong> {meeting.augmentedNotes}</p>
        </div>
      ))}
    </div>
  );
};

export default MeetingList; 