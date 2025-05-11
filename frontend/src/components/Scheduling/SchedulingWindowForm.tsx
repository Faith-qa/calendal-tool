import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface WindowFormData {
  startHour: number;
  endHour: number;
  weekday: string;
}

const SchedulingWindowForm: React.FC = () => {
  const { register, handleSubmit } = useForm<WindowFormData>();

  const onSubmit = async (data: WindowFormData) => {
    try {
      await api.post('/scheduling/windows', data);
      alert('Scheduling window created');
    } catch (error) {
      alert('Failed to create scheduling window');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-4 p-4 border rounded">
      <h2 className="text-xl mb-2">Create Scheduling Window</h2>
      <input
        type="number"
        {...register('startHour', { required: true, min: 0, max: 23 })}
        placeholder="Start Hour"
        className="border p-2 mr-2"
      />
      <input
        type="number"
        {...register('endHour', { required: true, min: 0, max: 24 })}
        placeholder="End Hour"
        className="border p-2 mr-2"
      />
      <select {...register('weekday', { required: true })} className="border p-2 mr-2">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Window</button>
    </form>
  );
};

export default SchedulingWindowForm; 