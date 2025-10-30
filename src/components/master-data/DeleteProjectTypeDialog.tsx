'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ProjectType {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

interface DeleteProjectTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectType: ProjectType | null;
}

export default function DeleteProjectTypeDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectType 
}: DeleteProjectTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!projectType) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/master-data/project-types/${projectType.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setDeleteError(result.error || 'Failed to delete project type');
        return;
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      setDeleteError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setDeleteError(null);
    onClose();
  };

  if (!isOpen || !projectType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Delete Project Type</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-delete-dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {deleteError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3" data-testid="delete-error">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the project type{' '}
              <span className="font-semibold">"{projectType.name}"</span>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action cannot be undone. The project type will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isDeleting}
              data-testid="cancel-delete"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isDeleting}
              data-testid="confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete Project Type'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}