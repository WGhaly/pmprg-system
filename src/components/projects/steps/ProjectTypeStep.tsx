'use client';

import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { Settings, ChevronRight, Info } from 'lucide-react';

interface ProjectTypeStepProps {
  register: UseFormRegister<CreateProjectWizardInput>;
  errors: FieldErrors<CreateProjectWizardInput>;
  watch: UseFormWatch<CreateProjectWizardInput>;
  setValue: UseFormSetValue<CreateProjectWizardInput>;
}

interface ProjectType {
  id: string;
  code: string;
  name: string;
  description?: string;
  tiers: Tier[];
}

interface Tier {
  id: string;
  code: string;
  name: string;
  description?: string;
  sizeHint?: string;
}

export default function ProjectTypeStep({ register, errors, watch, setValue }: ProjectTypeStepProps) {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierDetails, setTierDetails] = useState<any>(null);
  const [loadingTierDetails, setLoadingTierDetails] = useState(false);

  const selectedProjectTypeId = watch('projectTypeId');
  const selectedTierId = watch('tierId');

  // Fetch project types on component mount
  useEffect(() => {
    fetchProjectTypes();
  }, []);

  // When project type changes, clear tier selection
  useEffect(() => {
    if (selectedProjectTypeId) {
      setValue('tierId', '');
      setTierDetails(null);
    }
  }, [selectedProjectTypeId, setValue]);

  // When tier changes, fetch tier details
  useEffect(() => {
    if (selectedTierId) {
      fetchTierDetails(selectedTierId);
    } else {
      setTierDetails(null);
    }
  }, [selectedTierId]);

  const fetchProjectTypes = async () => {
    try {
      const response = await fetch('/api/master-data/project-types');
      if (response.ok) {
        const data = await response.json();
        setProjectTypes(data);
      }
    } catch (error) {
      console.error('Error fetching project types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTierDetails = async (tierId: string) => {
    setLoadingTierDetails(true);
    try {
      const response = await fetch(`/api/master-data/tiers/${tierId}/blocks`);
      if (response.ok) {
        const data = await response.json();
        setTierDetails(data);
      }
    } catch (error) {
      console.error('Error fetching tier details:', error);
    } finally {
      setLoadingTierDetails(false);
    }
  };

  const selectedProjectType = projectTypes.find(pt => pt.id === selectedProjectTypeId);
  const availableTiers = selectedProjectType?.tiers || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-primary-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Project Type & Tier</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose the project type and tier to determine the project structure
        </p>
      </div>

      <div className="space-y-6">
        {/* Project Type Selection */}
        <div>
          <label htmlFor="projectTypeId" className="label">
            Project Type *
          </label>
          <select
            id="projectTypeId"
            {...register('projectTypeId')}
            className={`input-field ${errors.projectTypeId ? 'border-red-300' : ''}`}
            data-testid="project-type-select"
          >
            <option value="">Select a project type</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.code})
              </option>
            ))}
          </select>
          {errors.projectTypeId && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-type-error">
              {errors.projectTypeId.message}
            </p>
          )}
          {selectedProjectType?.description && (
            <p className="mt-1 text-sm text-gray-600">
              {selectedProjectType.description}
            </p>
          )}
        </div>

        {/* Tier Selection */}
        {selectedProjectTypeId && (
          <div>
            <label htmlFor="tierId" className="label">
              Tier *
            </label>
            <select
              id="tierId"
              {...register('tierId')}
              className={`input-field ${errors.tierId ? 'border-red-300' : ''}`}
              data-testid="tier-select"
            >
              <option value="">Select a tier</option>
              {availableTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} ({tier.code})
                  {tier.sizeHint && ` - ${tier.sizeHint}`}
                </option>
              ))}
            </select>
            {errors.tierId && (
              <p className="mt-1 text-sm text-red-600" data-testid="tier-error">
                {errors.tierId.message}
              </p>
            )}
            
            {availableTiers.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <Info className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No tiers available for this project type. Please contact an administrator to configure tiers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tier Details */}
        {selectedTierId && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tier Configuration</h4>
            
            {loadingTierDetails ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : tierDetails ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Total Blocks:</span>
                    <span className="ml-2 text-gray-900">{tierDetails.totalBlocks}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total Duration:</span>
                    <span className="ml-2 text-gray-900">{tierDetails.totalDurationWeeks} weeks</span>
                  </div>
                </div>
                
                {tierDetails.tier.description && (
                  <p className="text-sm text-gray-600">{tierDetails.tier.description}</p>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Blocks in this tier:</p>
                  <div className="space-y-1">
                    {tierDetails.blocks.map((block: any, index: number) => (
                      <div key={block.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                            {index + 1}
                          </span>
                          <span className="text-gray-900">{block.block.name}</span>
                        </div>
                        <span className="text-gray-500">{block.durationWeeks}w</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Failed to load tier details</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}