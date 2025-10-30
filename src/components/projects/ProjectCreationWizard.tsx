'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectWizardSchema, type CreateProjectWizardInput } from '@/lib/validations/projects';
import { X, ArrowLeft, ArrowRight, Check, FileText, Settings, Calendar, Users, DollarSign, Eye } from 'lucide-react';
import BasicInfoStep from './steps/BasicInfoStep';
import ProjectTypeStep from './steps/ProjectTypeStep';
import SchedulingStep from './steps/SchedulingStep';
import ResourceAllocationStep from './steps/ResourceAllocationStep';
import BudgetStep from './steps/BudgetStep';
import PreviewStep from './steps/PreviewStep';
import { useToast } from '@/components/ui/Toast';

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: FileText, description: 'Project details' },
  { id: 2, name: 'Type & Tier', icon: Settings, description: 'Project configuration' },
  { id: 3, name: 'Scheduling', icon: Calendar, description: 'Timeline setup' },
  { id: 4, name: 'Resources', icon: Users, description: 'Team allocation' },
  { id: 5, name: 'Budget', icon: DollarSign, description: 'Financial planning' },
  { id: 6, name: 'Preview', icon: Eye, description: 'Review & confirm' },
];

export default function ProjectCreationWizard({ isOpen, onClose, onSuccess }: ProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectPreview, setProjectPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Toast hook for notifications
  const { toast, promiseToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm<CreateProjectWizardInput>({
    resolver: zodResolver(createProjectWizardSchema),
    defaultValues: {
      priority: 1,
      mode: 'strict_start',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const validateCurrentStep = async () => {
    const stepFields = getStepFields(currentStep);
    return await trigger(stepFields);
  };

  const getStepFields = (step: number): (keyof CreateProjectWizardInput)[] => {
    switch (step) {
      case 1:
        return ['code', 'name', 'clientType', 'notes'];
      case 2:
        return ['projectTypeId', 'tierId'];
      case 3:
        return ['priority', 'targetStartDate', 'mode'];
      case 4:
        return ['resourceAllocations'];
      case 5:
        return ['budgetCapex', 'budgetOpex'];
      case 6:
        return [];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      const currentStepName = STEPS.find(step => step.id === currentStep)?.name || 'Current step';
      toast.error('Validation failed', `Please complete all required fields in ${currentStepName} before proceeding.`);
      return;
    }

    if (currentStep === 5) {
      // Before going to preview, generate the project preview
      await generatePreview();
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    
    // Show success feedback for step progression
    const nextStepName = STEPS.find(step => step.id === currentStep + 1)?.name;
    if (nextStepName) {
      toast.success('Step completed', `Proceeding to ${nextStepName}`);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generatePreview = async () => {
    setPreviewLoading(true);
    
    try {
      const formData = getValues();
      const response = await fetch('/api/projects/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectTypeId: formData.projectTypeId,
          tierId: formData.tierId,
          targetStartDate: formData.targetStartDate,
          mode: formData.mode,
        }),
      });

      if (response.ok) {
        const preview = await response.json();
        setProjectPreview(preview);
        toast.success('Project preview generated', `${preview.blocks?.length || 0} project blocks configured`);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Preview generation failed', 'Unable to generate project preview. Please check your configuration.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const onSubmit = async (data: CreateProjectWizardInput) => {
    setIsSubmitting(true);

    // Use promiseToast for comprehensive project creation feedback
    const projectCreationPromise = fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(async (response) => {
      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors or other errors
        console.error('Project creation failed:', result);
        throw new Error(result.message || 'Failed to create project');
      }

      return result;
    });

    try {
      const result = await promiseToast(
        projectCreationPromise,
        {
          loading: 'Creating project...',
          success: (data) => `Project "${data.name || data.code}" created successfully!`,
          error: (error) => error.message || 'Failed to create project',
        },
        {
          successDuration: 4000,
          errorDuration: 8000,
        }
      );

      // Success - Reset form and close wizard
      reset();
      setCurrentStep(1);
      setProjectPreview(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      // Error handling is done by promiseToast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Check if user has made progress and warn about losing data
    const formData = getValues();
    const hasData = formData.name || formData.code || formData.projectTypeId || Object.keys(formData.resourceAllocations || {}).length > 0;
    
    if (hasData && currentStep > 1) {
      toast.warning('Wizard closed', 'Your progress has been lost. Use the browser back button to return if needed.');
    }
    
    reset();
    setCurrentStep(1);
    setProjectPreview(null);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep register={register} errors={errors} watch={watch} />;
      case 2:
        return <ProjectTypeStep register={register} errors={errors} watch={watch} setValue={setValue} />;
      case 3:
        return <SchedulingStep register={register} errors={errors} watch={watch} setValue={setValue} />;
      case 4:
        return <ResourceAllocationStep register={register} errors={errors} watch={watch} setValue={setValue} />;
      case 5:
        return <BudgetStep register={register} errors={errors} watch={watch} />;
      case 6:
        return (
          <PreviewStep 
            formData={watchedValues} 
            preview={projectPreview} 
            isLoading={previewLoading}
            onRegeneratePreview={generatePreview}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    const stepFields = getStepFields(currentStep);
    return stepFields.every(field => {
      const value = watchedValues[field];
      return value !== undefined && value !== '' && value !== null;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-wizard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, stepIdx) => {
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <li key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                          ${isComplete
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : isCurrent
                            ? 'border-primary-600 text-primary-600'
                            : 'border-gray-300 text-gray-500'
                          }
                        `}
                      >
                        {isComplete ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3 text-left">
                        <p
                          className={`text-sm font-medium ${
                            isCurrent ? 'text-primary-600' : isComplete ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    {stepIdx < STEPS.length - 1 && (
                      <div
                        className={`ml-6 w-16 h-0.5 ${
                          isComplete ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handlePrevious}
            className={`btn-secondary flex items-center ${
              currentStep === 1 ? 'invisible' : ''
            }`}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex items-center"
                disabled={!canProceed() || previewLoading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="btn-primary flex items-center"
                disabled={isSubmitting || !projectPreview?.isValid}
              >
                <Check className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}