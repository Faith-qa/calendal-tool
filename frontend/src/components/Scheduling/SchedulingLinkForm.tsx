import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface LinkFormData {
  name: string;
  duration: number;
  questions: string[];
}

const SchedulingLinkForm: React.FC = () => {
  const { register, handleSubmit } = useForm<LinkFormData>({
    defaultValues: {
      questions: ['', '', ''],
    },
  });

  const onSubmit = async (data: LinkFormData) => {
    try {
      await api.post('/scheduling/links', {
        ...data,
        questions: data.questions.filter(q => q.trim() !== ''),
      });
      alert('Scheduling link created');
    } catch (error) {
      alert('Failed to create scheduling link');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-4 p-4 border rounded">
      <h2 className="text-xl mb-2">Create Scheduling Link</h2>
      <input
        {...register('name', { required: true })}
        placeholder="Link Name"
        className="border p-2 mb-2 w-full"
      />
      <input
        type="number"
        {...register('duration', { required: true, min: 15, max: 120 })}
        placeholder="Duration (minutes)"
        className="border p-2 mb-2 w-full"
      />
      <div>
        <h3 className="mb-2">Questions</h3>
        {[...Array(3)].map((_, index) => (
          <input
            key={index}
            {...register(`questions.${index}` as const)}
            placeholder={`Question ${index + 1}`}
            className="border p-2 mb-2 w-full"
          />
        ))}
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Link</button>
    </form>
  );
};

export default SchedulingLinkForm; 