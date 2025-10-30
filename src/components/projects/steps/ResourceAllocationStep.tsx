'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, CheckCircle, AlertTriangle, Clock, Zap, Lightbulb, TrendingUp } from 'lucide-react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { CreateProjectWizardInput } from '@/lib/validations/projects';
import { useCapacityValidation } from '@/hooks/useCapacityValidation';
import { useToast } from '@/components/ui/Toast';

interface ResourceAllocationStepProps {
  register: UseFormRegister<CreateProjectWizardInput>;
  errors: FieldErrors<CreateProjectWizardInput>;
  watch: UseFormWatch<CreateProjectWizardInput>;
  setValue: UseFormSetValue<CreateProjectWizardInput>;
}

interface Resource {
  id: string;
  name: string;
  employeeCode: string;
  homeTeam: string;
  employmentType: string;
  capacityHoursPerWeek: number;
  derivedMetrics: {
    hourlyRate: number;
    weeklyCapacity: number;
    annualCapacity: number;
  };
  skills: Array<{
    skillId: string;
    skillCode: string;
    skillName: string;
    skillCategory: string;
    level: number;
  }>;
}

interface ProjectRequirement {
  blockId: string;
  blockName: string;
  blockCode: string;
  duration: number;
  requiredSkills: Array<{
    skillId: string;
    skillName: string;
    category: string;
    minimumLevel: number;
  }>;
  suggestedResources: Resource[];
  allocatedResources: Array<{
    resourceId: string;
    resourceName: string;
    allocationPercentage: number;
    hoursPerWeek: number;
  }>;
}

interface AllocationRecommendation {
  blockId: string;
  blockName: string;
  recommendations: Array<{
    resource: Resource;
    matchScore: number;
    skillMatches: Array<{
      skillName: string;
      requiredLevel: number;
      resourceLevel: number;
      isMatch: boolean;
    }>;
    capacityMatch: {
      availableHours: number;
      requiredHours: number;
      utilizationImpact: number;
    };
  }>;
}

export default function ResourceAllocationStep({ register, errors, watch, setValue }: ResourceAllocationStepProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirement[]>([]);
  const [allocationRecommendations, setAllocationRecommendations] = useState<AllocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [autoAssignMode, setAutoAssignMode] = useState(false);

  // Toast hook for notifications
  const { toast, dismissToast } = useToast();

  // Watch form values to trigger recommendations when project structure changes
  const watchedValues = watch();
  const { projectTypeId, tierId, targetStartDate, mode, resourceAllocations } = watchedValues;
  
  // Calculate project timeframe for capacity validation
  const projectTimeframe = useMemo(() => {
    if (!targetStartDate) return null;
    
    const startDate = new Date(targetStartDate);
    // Calculate estimated end date based on project requirements (fallback to 12 weeks)
    const estimatedDurationWeeks = projectRequirements.reduce((total, req) => 
      Math.max(total, req.duration), 12
    );
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (estimatedDurationWeeks * 7));
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [targetStartDate, projectRequirements]);

  // Real-time capacity validation
  const {
    validationResult,
    isValidating,
    getResourceValidation,
    getBlockValidation,
    getProjectValidation,
  } = useCapacityValidation(
    resourceAllocations || {},
    projectTimeframe || { startDate: '', endDate: '' },
    500 // 500ms debounce
  );

  // Load resources and project requirements
  useEffect(() => {
    if (projectTypeId && tierId) {
      loadResourcesAndRequirements();
    }
  }, [projectTypeId, tierId, targetStartDate, mode]);

  // Monitor capacity validation changes and provide feedback
  useEffect(() => {
    if (!isValidating && validationResult && resourceAllocations && Object.keys(resourceAllocations).length > 0) {
      // Only show notifications if there are actual allocations to validate
      const hasAllocations = Object.values(resourceAllocations).some(blockAllocs => 
        Object.keys(blockAllocs).length > 0
      );
      
      if (hasAllocations) {
        if (validationResult.errors.length > 0) {
          toast.error(
            'Capacity validation failed',
            `${validationResult.errors.length} capacity conflict${validationResult.errors.length > 1 ? 's' : ''} detected. Please review resource allocations.`
          );
        } else if (validationResult.warnings.length > 0) {
          toast.warning(
            'Capacity warnings detected',
            `${validationResult.warnings.length} potential issue${validationResult.warnings.length > 1 ? 's' : ''} found. Consider adjusting allocations.`
          );
        } else {
          // Only show success for meaningful validations
          const totalAllocations = Object.values(resourceAllocations).reduce((total, blockAllocs) => 
            total + Object.keys(blockAllocs).length, 0
          );
          if (totalAllocations > 0) {
            toast.success(
              'Capacity validation passed',
              `All ${totalAllocations} resource allocation${totalAllocations > 1 ? 's are' : ' is'} within capacity limits`
            );
          }
        }
      }
    }
  }, [validationResult, isValidating, resourceAllocations, toast]);

  const loadResourcesAndRequirements = async () => {
    setLoading(true);
    
    const loadingToastId = toast.loading("Loading available resources and project requirements...");
    
    try {
      // Load available resources
      const resourcesResponse = await fetch('/api/resources?includeSkills=true&activeOnly=true');
      let resourcesData: Resource[] = [];
      if (resourcesResponse.ok) {
        resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
        toast.success(`Loaded ${resourcesData.length} available resources`);
      } else {
        throw new Error('Failed to load resources');
      }

      // Get project structure preview to understand resource requirements
      const previewResponse = await fetch('/api/projects/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectTypeId,
          tierId,
          targetStartDate,
          mode,
        }),
      });

      if (previewResponse.ok) {
        const preview = await previewResponse.json();
        
        // Transform project blocks into resource requirements
        const requirements: ProjectRequirement[] = preview.projectPlan.blocks.map((block: any) => ({
          blockId: block.blockId || block.id,
          blockName: block.blockName || block.name,
          blockCode: block.blockCode || block.code,
          duration: block.plannedDurationWeeks || block.duration,
          requiredSkills: block.skillsMix || block.requiredSkills || [],
          suggestedResources: [],
          allocatedResources: [],
        }));

        setProjectRequirements(requirements);
        toast.success(`Project structure loaded: ${requirements.length} blocks requiring resources`);

        // Generate resource recommendations for each block
        await generateResourceRecommendations(requirements, resourcesData);
        dismissToast(loadingToastId);
      } else {
        throw new Error('Failed to load project preview');
      }
    } catch (error) {
      console.error('Error loading resources and requirements:', error);
      dismissToast(loadingToastId);
      toast.error('Failed to load project resources and requirements', 'Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const generateResourceRecommendations = async (requirements: ProjectRequirement[], availableResources: Resource[]) => {
    try {
      const recommendations: AllocationRecommendation[] = [];

      for (const requirement of requirements) {
        const blockRecommendations = availableResources
          .map(resource => {
            // Calculate skill match score
            const skillMatches = requirement.requiredSkills.map(reqSkill => {
              const resourceSkill = resource.skills.find(s => s.skillId === reqSkill.skillId);
              return {
                skillName: reqSkill.skillName,
                requiredLevel: reqSkill.minimumLevel,
                resourceLevel: resourceSkill?.level || 0,
                isMatch: resourceSkill ? resourceSkill.level >= reqSkill.minimumLevel : false,
              };
            });

            const matchingSkills = skillMatches.filter(sm => sm.isMatch).length;
            const totalRequiredSkills = requirement.requiredSkills.length;
            const skillMatchScore = totalRequiredSkills > 0 ? (matchingSkills / totalRequiredSkills) * 100 : 50;

            // Mock capacity calculation (in real implementation, this would check current allocations)
            const estimatedRequiredHours = resource.capacityHoursPerWeek * 0.5; // Assume 50% allocation
            const capacityMatch = {
              availableHours: resource.capacityHoursPerWeek,
              requiredHours: estimatedRequiredHours,
              utilizationImpact: (estimatedRequiredHours / resource.capacityHoursPerWeek) * 100,
            };

            const capacityScore = capacityMatch.availableHours >= capacityMatch.requiredHours ? 100 : 50;
            const overallMatchScore = (skillMatchScore + capacityScore) / 2;

            return {
              resource,
              matchScore: Math.round(overallMatchScore),
              skillMatches,
              capacityMatch,
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5); // Top 5 recommendations per block

        recommendations.push({
          blockId: requirement.blockId,
          blockName: requirement.blockName,
          recommendations: blockRecommendations,
        });
      }

      setAllocationRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const handleResourceAssignment = (blockId: string, resourceId: string, allocationPercentage: number) => {
    setProjectRequirements(prev => prev.map(req => {
      if (req.blockId === blockId) {
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
          const hoursPerWeek = (resource.capacityHoursPerWeek * allocationPercentage) / 100;
          
          const existingAllocation = req.allocatedResources.find(ar => ar.resourceId === resourceId);
          if (existingAllocation) {
            // Update existing allocation
            toast.success('Resource allocation updated', `${resource.name} allocation updated to ${allocationPercentage}%`);
            return {
              ...req,
              allocatedResources: req.allocatedResources.map(ar =>
                ar.resourceId === resourceId
                  ? { ...ar, allocationPercentage, hoursPerWeek }
                  : ar
              ),
            };
          } else {
            // Add new allocation
            toast.success('Resource assigned', `${resource.name} assigned to ${req.blockName} at ${allocationPercentage}%`);
            return {
              ...req,
              allocatedResources: [
                ...req.allocatedResources,
                {
                  resourceId,
                  resourceName: resource.name,
                  allocationPercentage,
                  hoursPerWeek,
                },
              ],
            };
          }
        }
      }
      return req;
    }));

    // Update form values
    const currentAllocations = watch('resourceAllocations') || {};
    const updatedAllocations = {
      ...currentAllocations,
      [blockId]: {
        ...(currentAllocations[blockId] || {}),
        [resourceId]: allocationPercentage,
      },
    };
    setValue('resourceAllocations', updatedAllocations);
  };

  const handleRemoveAllocation = (blockId: string, resourceId: string) => {
    // Get resource name for toast notification
    const resource = resources.find(r => r.id === resourceId);
    const requirement = projectRequirements.find(req => req.blockId === blockId);
    
    setProjectRequirements(prev => prev.map(req => {
      if (req.blockId === blockId) {
        return {
          ...req,
          allocatedResources: req.allocatedResources.filter(ar => ar.resourceId !== resourceId),
        };
      }
      return req;
    }));

    // Update form values
    const currentAllocations = watch('resourceAllocations') || {};
    if (currentAllocations[blockId]) {
      delete currentAllocations[blockId][resourceId];
      setValue('resourceAllocations', currentAllocations);
    }

    // Show success notification
    if (resource && requirement) {
      toast.success('Resource removed', `${resource.name} removed from ${requirement.blockName}`);
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssignMode(true);
    
    const autoAssignToastId = toast.loading('Optimizing team composition...', 'Analyzing skill requirements and resource availability');
    
    try {
      // Prepare project requirements for the intelligent recommendation engine
      const projectRequirementsForAPI = projectRequirements.map(req => ({
        blockId: req.blockId,
        blockName: req.blockName,
        blockCode: req.blockCode,
        duration: req.duration,
        startDate: targetStartDate || new Date().toISOString(),
        endDate: new Date(new Date(targetStartDate || new Date()).getTime() + req.duration * 7 * 24 * 60 * 60 * 1000).toISOString(),
        requiredSkills: req.requiredSkills.map(skill => skill.skillName),
        requiredEffort: req.duration * 40, // Assuming 40 hours per week
        priority: 5, // Default priority
        complexityScore: req.requiredSkills.length, // Simple complexity based on skill count
      }));

      const timeframe = {
        startDate: targetStartDate || new Date().toISOString(),
        endDate: new Date(new Date(targetStartDate || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      };

      // Get intelligent recommendations
      const response = await fetch('/api/resources/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectRequirements: projectRequirementsForAPI,
          timeframe,
          preferences: {
            autoAssign: true,
            maxAllocation: 40,
            prioritizeExperience: true,
            allowOverlap: false,
          },
        }),
      });

      if (response.ok) {
        const { recommendations } = await response.json();
        
        // Apply team composition optimization
        const optimizedAllocations = optimizeTeamComposition(recommendations, projectRequirementsForAPI);
        
        // Convert optimized recommendations to resource allocations
        const newAllocations: Record<string, Record<string, number>> = {};
        
        optimizedAllocations.forEach((recommendation: any) => {
          // For each recommended resource, allocate across relevant blocks
          Object.entries(recommendation.recommendedAllocation).forEach(([blockId, hours]) => {
            if (!newAllocations[blockId]) {
              newAllocations[blockId] = {};
            }
            newAllocations[blockId][recommendation.resource.id] = hours as number;
          });
        });
        
        // Apply the auto allocations to the form
        setValue('resourceAllocations', newAllocations);
        
        // Update UI state to reflect allocations
        setProjectRequirements(prev => prev.map(req => {
          const blockAllocations = newAllocations[req.blockId] || {};
          const allocatedResources = Object.entries(blockAllocations)
            .filter(([_, hours]) => hours > 0)
            .map(([resourceId, hours]) => {
              const resource = resources.find(r => r.id === resourceId);
              return {
                resourceId,
                resourceName: resource?.name || 'Unknown',
                allocationPercentage: Math.round((hours / 40) * 100), // Assuming 40h standard week
                hoursPerWeek: hours,
              };
            });
          
          return {
            ...req,
            allocatedResources,
          };
        }));
        
        // Success notification with details
        dismissToast(autoAssignToastId);
        const totalAssignments = Object.values(newAllocations).reduce((total, blockAllocs) => 
          total + Object.keys(blockAllocs).length, 0
        );
        toast.success(
          'Team optimized successfully!', 
          `Auto-assigned ${optimizedAllocations.length} resources across ${Object.keys(newAllocations).length} blocks (${totalAssignments} total assignments)`
        );
      } else {
        throw new Error('Failed to get recommendations from server');
      }
    } catch (error) {
      console.error('Error in auto assignment:', error);
      dismissToast(autoAssignToastId);
      toast.error(
        'Auto-assignment failed', 
        'Unable to optimize team composition. Please try manual assignment or contact support.'
      );
    } finally {
      setAutoAssignMode(false);
    }
  };

  // Team composition optimization function
  const optimizeTeamComposition = (recommendations: any[], projectRequirements: any[]) => {
    // Clone recommendations for optimization
    let optimized = [...recommendations];
    
    // 1. Ensure skill coverage across all requirements
    const allRequiredSkills = new Set(
      projectRequirements.flatMap(req => req.requiredSkills)
    );
    
    const coveredSkills = new Set();
    optimized.forEach(rec => {
      rec.skillAnalysis.matchingSkills.forEach((skill: string) => {
        coveredSkills.add(skill);
      });
    });
    
    // 2. Add resources to cover missing critical skills
    const missingSkills = Array.from(allRequiredSkills).filter(skill => !coveredSkills.has(skill));
    if (missingSkills.length > 0) {
      // Find additional resources that can cover missing skills
      const additionalResources = resources.filter(resource => 
        resource.skills.some(skill => missingSkills.includes(skill.skillName)) &&
        !optimized.some(rec => rec.resource.id === resource.id)
      );
      
      // Add top resources for missing skills (simplified logic)
      additionalResources.slice(0, 2).forEach(resource => {
        optimized.push({
          resource: {
            id: resource.id,
            name: resource.name,
            homeTeam: resource.homeTeam,
            hourlyRate: resource.derivedMetrics.hourlyRate,
          },
          skillAnalysis: {
            score: 60, // Default moderate score
            matchingSkills: resource.skills
              .filter(skill => missingSkills.includes(skill.skillName))
              .map(skill => skill.skillName),
          },
          overallScore: 60,
          recommendedAllocation: {},
        });
      });
    }
    
    // 3. Optimize for team diversity and reduce over-concentration
    const teamDistribution: Record<string, number> = {};
    optimized.forEach(rec => {
      const team = rec.resource.homeTeam;
      teamDistribution[team] = (teamDistribution[team] || 0) + 1;
    });
    
    // If one team is over-represented (>50% of team), try to balance
    const totalResources = optimized.length;
    const overRepresentedTeams = Object.entries(teamDistribution)
      .filter(([_, count]) => count > totalResources * 0.5);
    
    if (overRepresentedTeams.length > 0) {
      // Sort by score and keep best performers while diversifying teams
      optimized = optimized.sort((a, b) => b.overallScore - a.overallScore);
      
      const balanced: any[] = [];
      const teamCounts: Record<string, number> = {};
      const maxPerTeam = Math.ceil(totalResources / Object.keys(teamDistribution).length);
      
      optimized.forEach(rec => {
        const team = rec.resource.homeTeam;
        if ((teamCounts[team] || 0) < maxPerTeam || balanced.length < 3) {
          balanced.push(rec);
          teamCounts[team] = (teamCounts[team] || 0) + 1;
        }
      });
      
      optimized = balanced;
    }
    
    // 4. Ensure minimum team size and maximum efficiency
    if (optimized.length < 2) {
      // Add at least one more resource for collaboration
      const availableResources = resources.filter(resource => 
        !optimized.some(rec => rec.resource.id === resource.id)
      );
      
      if (availableResources.length > 0) {
        optimized.push({
          resource: {
            id: availableResources[0].id,
            name: availableResources[0].name,
            homeTeam: availableResources[0].homeTeam,
            hourlyRate: availableResources[0].derivedMetrics.hourlyRate,
          },
          skillAnalysis: { score: 50, matchingSkills: [] },
          overallScore: 50,
          recommendedAllocation: {},
        });
      }
    } else if (optimized.length > 8) {
      // Limit team size for manageability
      optimized = optimized.slice(0, 8);
    }
    
    return optimized;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTotalAllocatedHours = () => {
    return projectRequirements.reduce((total, req) => {
      return total + req.allocatedResources.reduce((blockTotal, allocation) => {
        return blockTotal + allocation.hoursPerWeek;
      }, 0);
    }, 0);
  };

  const getAllocatedResourcesCount = () => {
    const allocatedResourceIds = new Set();
    projectRequirements.forEach(req => {
      req.allocatedResources.forEach(allocation => {
        allocatedResourceIds.add(allocation.resourceId);
      });
    });
    return allocatedResourceIds.size;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading resource recommendations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Allocation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Assign resources to project blocks based on skill requirements and availability
        </p>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Total Blocks</div>
            <div className="text-2xl font-bold text-blue-900">{projectRequirements.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Allocated Resources</div>
            <div className="text-2xl font-bold text-green-900">{getAllocatedResourcesCount()}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Total Hours/Week</div>
            <div className="text-2xl font-bold text-purple-900">{Math.round(getTotalAllocatedHours())}</div>
          </div>
        </div>

        {/* Auto Assignment Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Intelligent Team Assignment</h3>
              <p className="text-xs text-blue-700 mt-1">
                AI-powered resource allocation with team composition optimization
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={autoAssignMode || !projectRequirements.length}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4 mr-2" />
              {autoAssignMode ? 'Optimizing Team...' : 'Smart Auto-assign'}
            </button>
          </div>
          
          {/* Auto Assignment Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center text-blue-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Skill Matching
            </div>
            <div className="flex items-center text-blue-700">
              <Users className="h-3 w-3 mr-1" />
              Team Diversity
            </div>
            <div className="flex items-center text-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              Capacity Optimization
            </div>
            <div className="flex items-center text-blue-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Performance Scoring
            </div>
          </div>
        </div>
      </div>

      {/* Resource Allocation for Each Block */}
      <div className="space-y-6">
        {projectRequirements.map((requirement) => {
          const recommendations = allocationRecommendations.find(r => r.blockId === requirement.blockId);
          
          return (
            <div key={requirement.blockId} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{requirement.blockName}</h4>
                  <p className="text-sm text-gray-500">Duration: {requirement.duration} days</p>
                </div>
                <div className="text-sm text-gray-500">
                  {requirement.allocatedResources.length} resources allocated
                </div>
              </div>

              {/* Required Skills */}
              {requirement.requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h5>
                  <div className="flex flex-wrap gap-2">
                    {requirement.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill.skillName} (Level {skill.minimumLevel}+)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Capacity Validation Status */}
              {projectTimeframe && (
                <div className="mb-4">
                  {isValidating ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Validating capacity...
                    </div>
                  ) : validationResult && (
                    <div className="space-y-2">
                      {validationResult.errors.length > 0 && (
                        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Capacity Issues</p>
                            <ul className="text-sm text-red-700 mt-1 space-y-1">
                              {validationResult.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
                        <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Capacity Warnings</p>
                            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                              {validationResult.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {validationResult.suggestions.length > 0 && (
                        <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Suggestions</p>
                            <ul className="text-sm text-blue-700 mt-1 space-y-1">
                              {validationResult.suggestions.map((suggestion, index) => (
                                <li key={index}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <p className="text-sm font-medium text-green-800">All allocations are within capacity limits</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Current Allocations */}
              {requirement.allocatedResources.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Current Allocations:</h5>
                  <div className="space-y-2">
                    {requirement.allocatedResources.map((allocation) => (
                      <div key={allocation.resourceId} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                        <div>
                          <span className="font-medium text-green-900">{allocation.resourceName}</span>
                          <span className="text-sm text-green-700 ml-2">
                            {allocation.allocationPercentage}% ({Math.round(allocation.hoursPerWeek)}h/week)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllocation(requirement.blockId, allocation.resourceId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Recommendations */}
              {recommendations && recommendations.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Recommended Resources:</h5>
                  <div className="space-y-3">
                    {recommendations.recommendations.map((rec) => (
                      <div key={rec.resource.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{rec.resource.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({rec.resource.employeeCode})</span>
                            <span className="text-sm text-gray-500 ml-2">• {rec.resource.homeTeam}</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMatchScoreColor(rec.matchScore)}`}>
                            {rec.matchScore}% match
                          </span>
                        </div>

                        {/* Skill Matches */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">Skill Matches:</div>
                          <div className="flex flex-wrap gap-1">
                            {rec.skillMatches.map((skillMatch, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  skillMatch.isMatch
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {skillMatch.skillName}: L{skillMatch.resourceLevel}/{skillMatch.requiredLevel}
                                {skillMatch.isMatch ? <CheckCircle className="h-3 w-3 ml-1" /> : <AlertTriangle className="h-3 w-3 ml-1" />}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Capacity Information */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">Capacity:</div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{rec.capacityMatch.availableHours}h/week available</span>
                            <span className="text-gray-500 ml-2">
                              (Est. {Math.round(rec.capacityMatch.utilizationImpact)}% utilization)
                            </span>
                          </div>
                        </div>

                        {/* Assignment Controls */}
                        <div className="flex items-center space-x-3">
                          <label className="text-sm text-gray-700">Allocation:</label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="10"
                            defaultValue="50"
                            className="flex-1"
                            onChange={(e) => {
                              const percentage = parseInt(e.target.value);
                              handleResourceAssignment(requirement.blockId, rec.resource.id, percentage);
                            }}
                          />
                          <span className="text-sm text-gray-500 w-12">50%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary and Validation */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Allocation Summary:</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Blocks with allocations:</span>
            <span className="font-medium ml-2">
              {projectRequirements.filter(req => req.allocatedResources.length > 0).length} / {projectRequirements.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total weekly hours:</span>
            <span className="font-medium ml-2">{Math.round(getTotalAllocatedHours())}h</span>
          </div>
        </div>
        
        {projectRequirements.some(req => req.allocatedResources.length === 0) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Some blocks don't have resource allocations yet. Consider using Smart Auto-assign or manually assign resources.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}