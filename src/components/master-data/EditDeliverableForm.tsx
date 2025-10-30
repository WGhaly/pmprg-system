'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

const deliverableSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  qualityCriteria: z.string().optional(),
  acceptanceMetrics: z.string().optional(),
  blockId: z.string().min(1, 'Block is required'),
});

type DeliverableFormData = z.infer<typeof deliverableSchema>;

interface Block {
  id: string;
  code: string;
  name: string;
}

interface Deliverable {
  id: string;
  code: string;
  name: string;
  description?: string;
  qualityCriteria?: string;
  acceptanceMetrics?: string;
  blockId: string;
  block: {
    code: string;
    name: string;
  };
}

interface EditDeliverableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deliverable: Deliverable | null;
}

export default function EditDeliverableForm({
  isOpen,
  onClose,
  onSuccess,
  deliverable,
}: EditDeliverableFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<DeliverableFormData>({
    resolver: zodResolver(deliverableSchema),
  });

  // Load blocks when form opens
  useEffect(() => {
    if (isOpen) {
      loadBlocks();
    }
  }, [isOpen]);

  // Populate form when deliverable changes
  useEffect(() => {
    if (deliverable && isOpen) {
      setValue('code', deliverable.code);
      setValue('name', deliverable.name);
      setValue('description', deliverable.description || '');
      setValue('qualityCriteria', deliverable.qualityCriteria || '');
      setValue('acceptanceMetrics', deliverable.acceptanceMetrics || '');
      setValue('blockId', deliverable.blockId);
    }
  }, [deliverable, isOpen, setValue]);

  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      const response = await fetch('/api/master-data/blocks');
      if (!response.ok) {
        throw new Error('Failed to load blocks');
      }
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const onSubmit = async (data: DeliverableFormData) => {
    if (!deliverable) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/master-data/deliverables/${deliverable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deliverable');
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating deliverable:', error);
      alert(error instanceof Error ? error.message : 'Failed to update deliverable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Deliverable</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Code *
              </label>
              <input
                type="text"
                id="code"
                {...register('code')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., DEL001"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="blockId" className="block text-sm font-medium text-gray-700 mb-2">
                Block *
              </label>
              <select
                id="blockId"
                {...register('blockId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingBlocks}
              >
                <option value="">Select a block...</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.code} - {block.name}
                  </option>
                ))}
              </select>
              {errors.blockId && (
                <p className="mt-1 text-sm text-red-600">{errors.blockId.message}</p>
              )}
              {loadingBlocks && (
                <p className="mt-1 text-sm text-gray-500">Loading blocks...</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Project Charter"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the deliverable..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="qualityCriteria" className="block text-sm font-medium text-gray-700 mb-2">
              Quality Criteria
            </label>
            <textarea
              id="qualityCriteria"
              {...register('qualityCriteria')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Define quality standards and criteria..."
            />
            {errors.qualityCriteria && (
              <p className="mt-1 text-sm text-red-600">{errors.qualityCriteria.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="acceptanceMetrics" className="block text-sm font-medium text-gray-700 mb-2">
              Acceptance Metrics
            </label>
            <textarea
              id="acceptanceMetrics"
              {...register('acceptanceMetrics')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Define acceptance criteria and metrics..."
            />
            {errors.acceptanceMetrics && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptanceMetrics.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}