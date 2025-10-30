'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Deliverable {
  id: string;
  code: string;
  name: string;
  description?: string;
  block: {
    code: string;
    name: string;
  };
}

interface DeleteDeliverableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deliverable: Deliverable | null;
}

export default function DeleteDeliverableDialog({
  isOpen,
  onClose,
  onSuccess,
  deliverable,
}: DeleteDeliverableDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!deliverable) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/master-data/deliverables/${deliverable.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete deliverable');
      }

      onSuccess();
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete deliverable');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !deliverable) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Deliverable</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Are you sure you want to delete this deliverable?
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Code:</span>
                    <span className="text-gray-900">{deliverable.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">{deliverable.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Block:</span>
                    <span className="text-gray-900">
                      {deliverable.block.code} - {deliverable.block.name}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This action cannot be undone. The deliverable will be permanently removed from the system.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete Deliverable'}
          </button>
        </div>
      </div>
    </div>
  );
}