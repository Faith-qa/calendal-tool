import {useEffect, useState} from "react";
import {useAuth} from "../../contexts/AuthContext";
import api from "../../services/api";

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  accountEmail: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  accountEmail: string;
}

const MeetingList: React.FC = () => {
  const { googleToken, user, signOut } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (!googleToken) {
          throw new Error('Not authenticated. Please sign in.');
        }

        const response = await api.get('/meetings', {
          headers: { Authorization: `Bearer ${googleToken}` },
        });

        const { calendarEvents, hubspotContacts } = response.data;
        if (!Array.isArray(calendarEvents) || !Array.isArray(hubspotContacts)) {
          throw new Error('Invalid response format from server');
        }

        setMeetings(calendarEvents);
        setContacts(hubspotContacts);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch meetings:', err);
        setError(err.message || 'Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [googleToken]);

  if (loading) return <div className="text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  const groupedMeetings = meetings.reduce((acc, meeting) => {
    const email = meeting.accountEmail;
    if (!acc[email]) acc[email] = [];
    acc[email].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  const groupedContacts = contacts.reduce((acc, contact) => {
    const email = contact.accountEmail;
    if (!acc[email]) acc[email] = [];
    acc[email].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Meetings</h2>
          <div className="flex space-x-2">
            <a href="/schedule" className="text-sm text-blue-600 hover:underline">
              Schedule a Meeting
            </a>
            <a href="http://localhost:3000/api/auth/google/connect" className="text-sm text-blue-600 hover:underline">
              Connect Another Google Account
            </a>
            <a href="http://localhost:3000/api/auth/hubspot/connect" className="text-sm text-blue-600 hover:underline">
              Connect HubSpot Account
            </a>
            <button onClick={signOut} className="text-sm text-blue-600 hover:underline">
              Sign Out
            </button>
          </div>
        </div>
        {user && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Connected Google Accounts: {user.googleAccounts?.map(acc => acc.email).join(', ') || 'None'}
              </p>
              <p className="text-sm text-gray-600">
                Connected HubSpot Accounts: {user.hubspotAccounts?.map(acc => acc.email).join(', ') || 'None'}
              </p>
            </div>
        )}
        <h3 className="text-lg font-medium text-gray-800">Calendar Events</h3>
        {Object.keys(groupedMeetings).length === 0 ? (
            <p className="text-gray-600">No meetings scheduled.</p>
        ) : (
            Object.entries(groupedMeetings).map(([email, accountMeetings]) => (
                <div key={email} className="mb-6">
                  <h4 className="text-md font-medium text-gray-700">{email}</h4>
                  <ul className="divide-y divide-gray-200 mt-2">
                    {accountMeetings.map((meeting) => (
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
                </div>
            ))
        )}
        <h3 className="text-lg font-medium text-gray-800">HubSpot Contacts</h3>
        {Object.keys(groupedContacts).length === 0 ? (
            <p className="text-gray-600">No HubSpot contacts found.</p>
        ) : (
            Object.entries(groupedContacts).map(([email, accountContacts]) => (
                <div key={email} className="mb-6">
                  <h4 className="text-md font-medium text-gray-700">{email}</h4>
                  <ul className="divide-y divide-gray-200 mt-2">
                    {accountContacts.map((contact) => (
                        <li key={contact.id} className="py-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{contact.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{contact.email}</p>
                            </div>
                          </div>
                        </li>
                    ))}
                  </ul>
                </div>
            ))
        )}
      </div>
  );
};

export default MeetingList;