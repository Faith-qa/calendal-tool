import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface BookingFormData {
  email: string;
  linkedInUrl: string;
  answers: string[];
}

const BookingForm: React.FC<{ linkId: string | undefined; slotId: string }> = ({ linkId, slotId }) => {
  const { register, handleSubmit } = useForm<BookingFormData>({ defaultValues: { answers: ['', '', ''] } });

  const onSubmit = async (data: BookingFormData) => {
    if (!linkId) return;
    try {
      await api.post('/scheduling/book', {
        slotId,
        email: data.email,
        answers: data.answers.filter(a => a.trim() !== ''),
        metadata: { linkedInUrl: data.linkedInUrl },
        schedulingLinkId: linkId,
        date: new Date().toISOString().split('T')[0],
      });
      alert('Meeting booked successfully');
    } catch (error) {
      alert('Failed to book meeting');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 border rounded">
      <h2 className="text-xl mb-2">Book Your Slot</h2>
      <input
        {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })}
        placeholder="Email"
        className="border p-2 mb-2 w-full"
      />
      <input
        {...register('linkedInUrl', { required: true })}
        placeholder="LinkedIn URL"
        className="border p-2 mb-2 w-full"
      />
      <div>
        <h3>Answer Questions</h3>
        {[...Array(3)].map((_, index) => (
          <textarea
            key={index}
            {...register(`answers.${index}` as const)}
            placeholder={`Answer ${index + 1}`}
            className="border p-2 mb-2 w-full"
          />
        ))}
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Book Meeting</button>
    </form>
  );
};

export default BookingForm; 