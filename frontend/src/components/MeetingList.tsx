import React from 'react';

interface Meeting {
  id: string;
  email: string;
  startTime: string;
  endTime: string;
  answers: string;
  augmentedNotes: string;
}

interface MeetingListProps {
  meetings: Meeting[];
}

const MeetingList: React.FC<MeetingListProps> = ({ meetings }) => {
  return (
    <div>
      <h2 className="text-xl mb-2">Scheduled Meetings</h2>
      {meetings.map((meeting) => (
        <div key={meeting.id} className="border p-4 mb-2 rounded">
          <p>
            <strong>Email:</strong> {meeting.email}
          </p>
          <p>
            <strong>Time:</strong> {meeting.startTime} - {meeting.endTime}
          </p>
          <p>
            <strong>Answers:</strong> {meeting.answers}
          </p>
          <p>
            <strong>Augmented Notes:</strong> {meeting.augmentedNotes}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MeetingList; 