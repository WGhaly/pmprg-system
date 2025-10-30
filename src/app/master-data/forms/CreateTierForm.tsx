'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Loader2 } from 'lucide-react';

const createTierSchema = z.object({
  code: z.string().min(1, 'Code is required').max(10, 'Code must be at most 10 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  projectTypeId: z.string().min(1, 'Project type is required'),
  sizeHint: z.string().max(200, 'Size hint must be at most 200 characters').optional(),
});

type CreateTierFormData = z.infer<typeof createTierSchema>;

interface ProjectType {
  id: string;
  code: string;
  name: string;
}

interface CreateTierFormProps {
  onSuccess: () => void;
}

export default function CreateTierForm({ onSuccess }: CreateTierFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTierFormData>({
    resolver: zodResolver(createTierSchema),
  });

  // Load project types when form opens
  useEffect(() => {
    if (isOpen) {
      loadProjectTypes();
    }
  }, [isOpen]);

  const loadProjectTypes = async () => {
    setIsLoadingProjectTypes(true);
    try {
      const response = await fetch('/api/master-data/project-types');
      if (!response.ok) {
        throw new Error('Failed to load project types');
      }
      const data = await response.json();
      setProjectTypes(data);
    } catch (error) {
      console.error('Error loading project types:', error);
      setError('Failed to load project types');
    } finally {
      setIsLoadingProjectTypes(false);
    }
  };

  const onSubmit = async (data: CreateTierFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/master-data/tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tier');
      }

      // Success
      reset();
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating tier:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    reset();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Tier
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Tier</h2>
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
                  placeholder="T1, T2, T3..."
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
                  placeholder="Small, Medium, Large..."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="projectTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type *
                </label>
                {isLoadingProjectTypes ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading project types...
                  </div>
                ) : (
                  <select
                    {...register('projectTypeId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a project type</option>
                    {projectTypes.map((projectType) => (
                      <option key={projectType.id} value={projectType.id}>
                        {projectType.name} ({projectType.code})
                      </option>
                    ))}
                  </select>
                )}
                {errors.projectTypeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectTypeId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sizeHint" className="block text-sm font-medium text-gray-700 mb-1">
                  Size Hint
                </label>
                <textarea
                  {...register('sizeHint')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Description of project size or complexity..."
                />
                {errors.sizeHint && (
                  <p className="mt-1 text-sm text-red-600">{errors.sizeHint.message}</p>
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
                  {isSubmitting ? 'Creating...' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}