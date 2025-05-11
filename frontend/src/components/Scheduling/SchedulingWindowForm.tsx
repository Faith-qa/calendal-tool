import React from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface WindowFormData {
  startTime: string;
  endTime: string;
}

const SchedulingWindowForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<WindowFormData>();

  const onSubmit = async (data: WindowFormData) => {
    try {
      await api.post('/scheduling/windows', data);
      alert('Scheduling window created');
    } catch (error) {
      alert('Failed to create scheduling window');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4">Create Scheduling Window</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              {...register('startTime', { required: 'Start time is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              {...register('endTime', { 
                required: 'End time is required',
                validate: (value, formValues) => {
                  if (value <= formValues.startTime) {
                    return 'End time must be after start time';
                  }
                  return true;
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Window
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchedulingWindowForm; 