'use client';

import React from 'react';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { Eye, Calendar, Clock, DollarSign, AlertTriangle, CheckCircle, RefreshCw, Package } from 'lucide-react';

interface PreviewStepProps {
  formData: CreateProjectWizardInput;
  preview: any;
  isLoading: boolean;
  onRegeneratePreview: () => void;
}

export default function PreviewStep({ formData, preview, isLoading, onRegeneratePreview }: PreviewStepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalBudget = (formData.budgetCapex || 0) + (formData.budgetOpex || 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-sm text-gray-500">Generating project structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Eye className="mx-auto h-12 w-12 text-primary-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Project Preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Review the auto-generated project structure before creation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Summary */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Project Summary</h4>
          
          <div className="card space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Project Code:</span>
              <p className="text-sm text-gray-900">{formData.code}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Project Name:</span>
              <p className="text-sm text-gray-900">{formData.name}</p>
            </div>
            {formData.clientType && (
              <div>
                <span className="text-sm font-medium text-gray-500">Client Type:</span>
                <p className="text-sm text-gray-900 capitalize">{formData.clientType}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Priority:</span>
              <p className="text-sm text-gray-900">{formData.priority} (1 = Highest, 10 = Lowest)</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Scheduling Mode:</span>
              <p className="text-sm text-gray-900 capitalize">
                {formData.mode.replace('_', ' ')}
              </p>
            </div>
            {totalBudget > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Total Budget:</span>
                <p className="text-sm text-gray-900">{formatCurrency(totalBudget)}</p>
                {formData.budgetCapex && (
                  <p className="text-xs text-gray-500">CAPEX: {formatCurrency(formData.budgetCapex)}</p>
                )}
                {formData.budgetOpex && (
                  <p className="text-xs text-gray-500">OPEX: {formatCurrency(formData.budgetOpex)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auto-Planning Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Auto-Planning Results</h4>
            {preview && (
              <button
                onClick={onRegeneratePreview}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </button>
            )}
          </div>

          {preview ? (
            <div className="card space-y-4">
              {/* Validation Status */}
              <div className={`flex items-center p-3 rounded-lg ${
                preview.validation.isValid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {preview.validation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    preview.validation.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {preview.validation.isValid ? 'Planning Successful' : 'Planning Issues Detected'}
                  </p>
                  {!preview.validation.isValid && preview.validation.errors?.length > 0 && (
                    <ul className="mt-1 text-sm text-red-700">
                      {preview.validation.errors.map((error: string, index: number) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Project Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(preview.projectPlan.projectStart)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(preview.projectPlan.projectEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Planning Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Blocks:</span>
                    <span className="ml-2 font-medium">{preview.projectPlan.totalBlocks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{preview.projectPlan.totalDurationWeeks} weeks</span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {preview.validation.warnings?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">Warnings</p>
                      <ul className="mt-1 text-sm text-yellow-700">
                        {preview.validation.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-6">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Failed to generate project preview</p>
              <button
                onClick={onRegeneratePreview}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Blocks Detail */}
      {preview?.projectPlan?.blocks && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Project Blocks Timeline</h4>
          <div className="card">
            <div className="space-y-3">
              {preview.projectPlan.blocks.map((block: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {block.sequenceIndex}
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{block.blockName}</h5>
                        <p className="text-xs text-gray-500 mb-2">{block.blockCode}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(block.plannedStart)} - {formatDate(block.plannedEnd)}
                          <span className="ml-2">({block.plannedDurationWeeks} weeks)</span>
                        </div>
                        {block.deliverables?.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center text-xs text-gray-500 mb-1">
                              <Package className="h-3 w-3 mr-1" />
                              Deliverables ({block.deliverables.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {block.deliverables.map((deliverable: any) => (
                                <span
                                  key={deliverable.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {deliverable.code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {formData.notes && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Project Notes</h4>
          <div className="card">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}