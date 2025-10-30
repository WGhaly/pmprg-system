'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { FileText, User, MessageSquare } from 'lucide-react';

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

      <div className="grid grid-cols-1 gap-6">
        {/* Project Code */}
        <div>
          <label htmlFor="code" className="label">
            Project Code *
          </label>
          <input
            id="code"
            type="text"
            {...register('code')}
            className={`input-field ${errors.code ? 'border-red-300' : ''}`}
            placeholder="e.g., PROJ-2024-001"
            data-testid="project-code"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600" data-testid="code-error">
              {errors.code.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier for this project (used in reports and references)
          </p>
        </div>

        {/* Project Name */}
        <div>
          <label htmlFor="name" className="label">
            Project Name *
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`input-field ${errors.name ? 'border-red-300' : ''}`}
            placeholder="e.g., New Product Development Initiative"
            data-testid="project-name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600" data-testid="name-error">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Client Type */}
        <div>
          <label htmlFor="clientType" className="label">
            <User className="inline h-4 w-4 mr-1" />
            Client Type
          </label>
          <select
            id="clientType"
            {...register('clientType')}
            className={`input-field ${errors.clientType ? 'border-red-300' : ''}`}
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
            <p className="mt-1 text-sm text-red-600" data-testid="client-type-error">
              {errors.clientType.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">
            <MessageSquare className="inline h-4 w-4 mr-1" />
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            className={`input-field ${errors.notes ? 'border-red-300' : ''}`}
            placeholder="Additional notes, requirements, or context for this project..."
            data-testid="project-notes"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600" data-testid="notes-error">
              {errors.notes.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Optional additional information about the project
          </p>
        </div>
      </div>
    </div>
  );
}