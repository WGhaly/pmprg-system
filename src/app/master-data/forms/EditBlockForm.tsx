'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';

const updateBlockSchema = z.object({
  code: z.string().min(1, 'Code is required').max(10, 'Code must be at most 10 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  defaultDurationWeeks: z.number().min(1, 'Duration must be at least 1 week'),
  defaultDependencies: z.string().optional(),
  defaultSkillsMix: z.string().optional(),
});

type UpdateBlockFormData = z.infer<typeof updateBlockSchema>;

interface Block {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultDurationWeeks: number;
  defaultDependencies?: string;
  defaultSkillsMix?: string;
}

interface EditBlockFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  block: Block | null;
}

export default function EditBlockForm({ isOpen, onClose, onSuccess, block }: EditBlockFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateBlockFormData>({
    resolver: zodResolver(updateBlockSchema),
  });

  // Populate form with block data
  useEffect(() => {
    if (block && isOpen) {
      setValue('code', block.code);
      setValue('name', block.name);
      setValue('description', block.description || '');
      setValue('defaultDurationWeeks', block.defaultDurationWeeks);
      setValue('defaultDependencies', block.defaultDependencies || '');
      setValue('defaultSkillsMix', block.defaultSkillsMix || '');
    }
  }, [block, isOpen, setValue]);

  const onSubmit = async (data: UpdateBlockFormData) => {
    if (!block) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/master-data/blocks/${block.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update block');
      }

      // Success
      reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating block:', error);
      setError(error instanceof Error ? error.message : 'Failed to update block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Block</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              {...register('code')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="B01, B02, INIT..."
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Project Initiation, Requirements Analysis..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="defaultDurationWeeks" className="block text-sm font-medium text-gray-700 mb-1">
              Default Duration (Weeks) *
            </label>
            <input
              {...register('defaultDurationWeeks', { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.defaultDurationWeeks && (
              <p className="mt-1 text-sm text-red-600">{errors.defaultDurationWeeks.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Description of the block activities..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="defaultDependencies" className="block text-sm font-medium text-gray-700 mb-1">
              Default Dependencies (JSON)
            </label>
            <textarea
              {...register('defaultDependencies')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder='["previous_block_code"]'
            />
            {errors.defaultDependencies && (
              <p className="mt-1 text-sm text-red-600">{errors.defaultDependencies.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="defaultSkillsMix" className="block text-sm font-medium text-gray-700 mb-1">
              Default Skills Mix (JSON)
            </label>
            <textarea
              {...register('defaultSkillsMix')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder='{"PM": 0.5, "BA": 1.0}'
            />
            {errors.defaultSkillsMix && (
              <p className="mt-1 text-sm text-red-600">{errors.defaultSkillsMix.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isSubmitting ? 'Updating...' : 'Update Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}