import React from 'react';
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
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4">Create Scheduling Link</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <input
            {...register('name', { required: true })}
            placeholder="Link Name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="number"
            {...register('duration', { required: true, min: 15, max: 120 })}
            placeholder="Duration (minutes)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Questions</h3>
            {[...Array(3)].map((_, index) => (
              <input
                key={index}
                {...register(`questions.${index}` as const)}
                placeholder={`Question ${index + 1}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
              />
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Link
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchedulingLinkForm; 