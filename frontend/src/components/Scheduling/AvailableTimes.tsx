import { useEffect, useState } from 'react';
import api from '../../services/api';
import { TimeSlot } from '../../types';
import BookingForm from './BookingForm';

const AvailableTimes: React.FC<{ linkId: string | undefined; date: string }> = ({ linkId, date }) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (!linkId) return;
    const fetchSlots = async () => {
      try {
        const res = await api.get(`/scheduling/links/${linkId}/times?date=${date}`);
        setSlots(res.data);
      } catch (error) {
        alert('Failed to fetch available times');
      }
    };
    fetchSlots();
  }, [linkId, date]);

  return (
    <div>
      <h2 className="text-xl mb-2">Available Times on {date}</h2>
      <div className="grid grid-cols-3 gap-2">
        {slots.map(slot => (
          <button
            key={slot.id}
            onClick={() => setSelectedSlot(slot.id)}
            className={`border p-2 ${selectedSlot === slot.id ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {new Date(slot.start).toLocaleTimeString()} - {new Date(slot.end).toLocaleTimeString()}
          </button>
        ))}
      </div>
      {selectedSlot && <BookingForm linkId={linkId} slotId={selectedSlot} />}
    </div>
  );
};

export default AvailableTimes; 