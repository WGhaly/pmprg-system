'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { Calendar, Clock, Star, Info } from 'lucide-react';

interface SchedulingStepProps {
  register: UseFormRegister<CreateProjectWizardInput>;
  errors: FieldErrors<CreateProjectWizardInput>;
  watch: UseFormWatch<CreateProjectWizardInput>;
  setValue: UseFormSetValue<CreateProjectWizardInput>;
}

export default function SchedulingStep({ register, errors, watch, setValue }: SchedulingStepProps) {
  const selectedMode = watch('mode');
  const targetStartDate = watch('targetStartDate');

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  const handleModeChange = (mode: 'strict_start' | 'priority_fit') => {
    setValue('mode', mode);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="mx-auto h-12 w-12 text-primary-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Scheduling Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up the timeline and scheduling preferences for your project
        </p>
      </div>

      <div className="space-y-6">
        {/* Priority */}
        <div>
          <label htmlFor="priority" className="label">
            <Star className="inline h-4 w-4 mr-1" />
            Project Priority *
          </label>
          <select
            id="priority"
            {...register('priority', { valueAsNumber: true })}
            className={`input-field ${errors.priority ? 'border-red-300' : ''}`}
            data-testid="priority-select"
          >
            <option value={1}>1 - Highest Priority</option>
            <option value={2}>2 - High Priority</option>
            <option value={3}>3 - Medium-High Priority</option>
            <option value={4}>4 - Medium Priority</option>
            <option value={5}>5 - Normal Priority</option>
            <option value={6}>6 - Medium-Low Priority</option>
            <option value={7}>7 - Low Priority</option>
            <option value={8}>8 - Lower Priority</option>
            <option value={9}>9 - Very Low Priority</option>
            <option value={10}>10 - Lowest Priority</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600" data-testid="priority-error">
              {errors.priority.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Priority affects resource allocation and scheduling in multi-project environments
          </p>
        </div>

        {/* Target Start Date */}
        <div>
          <label htmlFor="targetStartDate" className="label">
            <Clock className="inline h-4 w-4 mr-1" />
            Target Start Date *
          </label>
          <input
            id="targetStartDate"
            type="date"
            min={today}
            {...register('targetStartDate')}
            className={`input-field ${errors.targetStartDate ? 'border-red-300' : ''}`}
            data-testid="target-start-date"
          />
          {errors.targetStartDate && (
            <p className="mt-1 text-sm text-red-600" data-testid="target-start-date-error">
              {errors.targetStartDate.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Preferred start date for the project (cannot be in the past)
          </p>
        </div>

        {/* Scheduling Mode */}
        <div>
          <label className="label">
            Scheduling Mode *
          </label>
          <div className="space-y-3">
            {/* Strict Start Mode */}
            <div
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors
                ${selectedMode === 'strict_start'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => handleModeChange('strict_start')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="strict_start"
                  checked={selectedMode === 'strict_start'}
                  onChange={() => handleModeChange('strict_start')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Strict Start</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Project must start on the exact target start date. Resources will be allocated to meet this timeline.
                  </p>
                </div>
              </div>
            </div>

            {/* Priority Fit Mode */}
            <div
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-colors
                ${selectedMode === 'priority_fit'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => handleModeChange('priority_fit')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="priority_fit"
                  checked={selectedMode === 'priority_fit'}
                  onChange={() => handleModeChange('priority_fit')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Priority Fit</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Project start date will be optimized based on priority and resource availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {errors.mode && (
            <p className="mt-1 text-sm text-red-600" data-testid="mode-error">
              {errors.mode.message}
            </p>
          )}
        </div>

        {/* Mode Information */}
        {selectedMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  {selectedMode === 'strict_start' ? 'Strict Start Mode' : 'Priority Fit Mode'}
                </h4>
                <div className="mt-1 text-sm text-blue-700">
                  {selectedMode === 'strict_start' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Project will start exactly on the target date</li>
                      <li>Resources will be allocated to meet this timeline</li>
                      <li>May require overtime or external resources if capacity is insufficient</li>
                      <li>Best for projects with fixed deadlines or external commitments</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Start date will be optimized based on resource availability</li>
                      <li>Higher priority projects get resources first</li>
                      <li>May start later than target date if resources are not available</li>
                      <li>Best for internal projects with flexible timelines</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}