'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProjectTypeSchema, type UpdateProjectTypeInput } from '@/lib/validations/master-data';
import { X, Save, AlertCircle } from 'lucide-react';

interface ProjectType {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

interface EditProjectTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectType: ProjectType | null;
}

export default function EditProjectTypeForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectType 
}: EditProjectTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = useForm<UpdateProjectTypeInput>({
    resolver: zodResolver(updateProjectTypeSchema),
  });

  // Reset form when projectType changes or dialog opens
  useEffect(() => {
    if (isOpen && projectType) {
      setValue('code', projectType.code);
      setValue('name', projectType.name);
      setValue('description', projectType.description || '');
      setValue('active', projectType.active);
      setSubmitError(null);
    }
  }, [isOpen, projectType, setValue]);

  const onSubmit = async (data: UpdateProjectTypeInput) => {
    if (!projectType) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/master-data/project-types/${projectType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.validationErrors) {
          // Set field-specific errors
          result.validationErrors.forEach((error: { field: string; message: string }) => {
            setError(error.field as any, { message: error.message });
          });
        } else {
          setSubmitError(result.error || 'Failed to update project type');
        }
        return;
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  if (!isOpen || !projectType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Project Type</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-edit-project-type-form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start" data-testid="form-error">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{submitError}</span>
            </div>
          )}

          {/* Code Field */}
          <div>
            <label htmlFor="edit-code" className="label">
              Code *
            </label>
            <input
              id="edit-code"
              type="text"
              {...register('code')}
              className={`input-field ${errors.code ? 'border-red-300' : ''}`}
              placeholder="e.g., R&D_HUB"
              data-testid="edit-project-type-code"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600" data-testid="edit-code-error">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="edit-name" className="label">
              Name *
            </label>
            <input
              id="edit-name"
              type="text"
              {...register('name')}
              className={`input-field ${errors.name ? 'border-red-300' : ''}`}
              placeholder="e.g., R&D Hub Setup"
              data-testid="edit-project-type-name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600" data-testid="edit-name-error">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="edit-description" className="label">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              {...register('description')}
              className={`input-field ${errors.description ? 'border-red-300' : ''}`}
              placeholder="Describe this project type..."
              data-testid="edit-project-type-description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600" data-testid="edit-description-error">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Active Field */}
          <div className="flex items-center">
            <input
              id="edit-active"
              type="checkbox"
              {...register('active')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              data-testid="edit-project-type-active"
            />
            <label htmlFor="edit-active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
              data-testid="cancel-edit-project-type"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSubmitting}
              data-testid="save-edit-project-type"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Updating...' : 'Update Project Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}