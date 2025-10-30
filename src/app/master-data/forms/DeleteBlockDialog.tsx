'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface Block {
  id: string;
  code: string;
  name: string;
  _count?: {
    tierBlocks: number;
    projectBlocks: number;
    deliverables: number;
  };
}

interface DeleteBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  block: Block | null;
}

export default function DeleteBlockDialog({ isOpen, onClose, onSuccess, block }: DeleteBlockDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!block) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/master-data/blocks/${block.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete block');
      }

      // Success
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error deleting block:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete block');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !block) return null;

  const hasUsage = block._count && (block._count.tierBlocks > 0 || block._count.projectBlocks > 0);
  const hasDeliverables = block._count && block._count.deliverables > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Delete Block</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-4">
            Are you sure you want to delete the block <strong>{block.name} ({block.code})</strong>?
          </p>

          {hasUsage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Cannot Delete:</p>
                  <p>This block is being used by {block._count?.tierBlocks || 0} tier configurations and {block._count?.projectBlocks || 0} project blocks.</p>
                </div>
              </div>
            </div>
          )}

          {!hasUsage && hasDeliverables && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning:</p>
                  <p>This block has {block._count?.deliverables || 0} associated deliverables that will also be deleted. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          )}

          {!hasUsage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning:</p>
                  <p>This action cannot be undone.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || hasUsage}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isDeleting ? 'Deleting...' : 'Delete Block'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}