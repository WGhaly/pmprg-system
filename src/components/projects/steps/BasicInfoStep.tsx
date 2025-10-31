'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { FileText, User, MessageSquare, Info, AlertCircle } from 'lucide-react';

interface BasicInfoStepProps {
  register: UseFormRegister<CreateProjectWizardInput>;
  errors: FieldErrors<CreateProjectWizardInput>;
  watch: UseFormWatch<CreateProjectWizardInput>;
}

export default function BasicInfoStep({ register, errors, watch }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-primary-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Project Basic Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by providing the fundamental details about your project
        </p>
      </div>

      {/* Form Field Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900">Form Field Guide</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Required
                </span>
                <span>Fields marked with * must be completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  Optional
                </span>
                <span>Fields that can be left empty or filled later</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Project Code */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="code" className="label">
              Project Code
            </label>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Required
            </span>
          </div>
          <input
            id="code"
            type="text"
            {...register('code')}
            className={`input-field ${errors.code ? 'border-red-300 ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            placeholder="e.g., PROJ-2024-001"
            data-testid="project-code"
          />
          {errors.code && (
            <div className="mt-1 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600" data-testid="code-error">
                {errors.code.message}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            <strong>Purpose:</strong> Unique identifier for this project (used in reports and references)
          </p>
        </div>

        {/* Project Name */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="name" className="label">
              Project Name
            </label>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Required
            </span>
          </div>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`input-field ${errors.name ? 'border-red-300 ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            placeholder="e.g., New Product Development Initiative"
            data-testid="project-name"
          />
          {errors.name && (
            <div className="mt-1 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600" data-testid="name-error">
                {errors.name.message}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            <strong>Purpose:</strong> Descriptive name that will appear in all project views and reports
          </p>
        </div>

        {/* Client Type */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="clientType" className="label">
              <User className="inline h-4 w-4 mr-1" />
              Client Type
            </label>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              Optional
            </span>
          </div>
          <select
            id="clientType"
            {...register('clientType')}
            className={`input-field ${errors.clientType ? 'border-red-300 ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            data-testid="client-type"
          >
            <option value="">Select client type (optional)</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="government">Government</option>
            <option value="non-profit">Non-Profit</option>
            <option value="startup">Startup</option>
            <option value="enterprise">Enterprise</option>
          </select>
          {errors.clientType && (
            <div className="mt-1 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600" data-testid="client-type-error">
                {errors.clientType.message}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            <strong>Purpose:</strong> Helps categorize projects by client type for reporting and analysis
          </p>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="notes" className="label">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Notes
            </label>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              Optional
            </span>
          </div>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            className={`input-field ${errors.notes ? 'border-red-300 ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            placeholder="Additional notes, requirements, or context for this project..."
            data-testid="project-notes"
          />
          {errors.notes && (
            <div className="mt-1 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600" data-testid="notes-error">
                {errors.notes.message}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            <strong>Purpose:</strong> Additional context, requirements, or special considerations for the project team
          </p>
        </div>
      </div>
    </div>
  );
}