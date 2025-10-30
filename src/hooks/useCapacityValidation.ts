import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface ResourceCapacity {
  resourceId: string;
  availableHours: number;
  totalCapacity: number;
  utilizationPercentage: number;
  conflicts: Array<{
    type: 'overallocation' | 'vacation' | 'project_overlap';
    severity: 'low' | 'medium' | 'high';
    description: string;
    period: string;
  }>;
  recommendations: string[];
}

interface CapacityValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  resourceCapacities: ResourceCapacity[];
  overallUtilization: number;
}

interface AllocationData {
  [blockId: string]: {
    [resourceId: string]: number;
  };
}

interface ProjectTimeframe {
  startDate: string;
  endDate: string;
}

export function useCapacityValidation(
  allocations: AllocationData,
  timeframe: ProjectTimeframe,
  debounceMs: number = 500
) {
  const [validationResult, setValidationResult] = useState<CapacityValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationId, setLastValidationId] = useState(0);

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (
      allocationData: AllocationData,
      timeframeData: ProjectTimeframe,
      validationId: number
    ) => {
      try {
        setIsValidating(true);
        
        const response = await fetch('/api/resources/capacity-validation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            allocations: allocationData,
            timeframe: timeframeData,
            validationId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to validate capacity');
        }

        const result = await response.json();
        
        // Only update if this is the latest validation request
        if (validationId === lastValidationId) {
          setValidationResult(result);
        }
      } catch (error) {
        console.error('Capacity validation error:', error);
        if (validationId === lastValidationId) {
          setValidationResult({
            isValid: false,
            warnings: [],
            errors: ['Failed to validate resource capacity. Please try again.'],
            suggestions: [],
            resourceCapacities: [],
            overallUtilization: 0,
          });
        }
      } finally {
        if (validationId === lastValidationId) {
          setIsValidating(false);
        }
      }
    }, debounceMs),
    [debounceMs, lastValidationId]
  );

  // Trigger validation when allocations or timeframe change
  useEffect(() => {
    if (!allocations || !timeframe?.startDate || !timeframe?.endDate) {
      setValidationResult(null);
      return;
    }

    // Check if there are any allocations to validate
    const hasAllocations = Object.values(allocations).some(blockAllocations =>
      Object.values(blockAllocations).some(hours => hours > 0)
    );

    if (!hasAllocations) {
      setValidationResult(null);
      return;
    }

    const validationId = Date.now();
    setLastValidationId(validationId);
    debouncedValidate(allocations, timeframe, validationId);

    // Cleanup function to cancel debounced calls
    return () => {
      debouncedValidate.cancel();
    };
  }, [allocations, timeframe, debouncedValidate]);

  // Helper function to get validation status for a specific resource
  const getResourceValidation = useCallback((resourceId: string) => {
    if (!validationResult) return null;

    const resourceCapacity = validationResult.resourceCapacities.find(
      rc => rc.resourceId === resourceId
    );

    if (!resourceCapacity) return null;

    return {
      isOverallocated: resourceCapacity.utilizationPercentage > 100,
      utilizationPercentage: resourceCapacity.utilizationPercentage,
      conflicts: resourceCapacity.conflicts,
      recommendations: resourceCapacity.recommendations,
      availableHours: resourceCapacity.availableHours,
    };
  }, [validationResult]);

  // Helper function to get validation status for a specific block
  const getBlockValidation = useCallback((blockId: string) => {
    if (!validationResult || !allocations[blockId]) return null;

    const blockAllocations = allocations[blockId];
    const allocatedResources = Object.keys(blockAllocations).filter(
      resourceId => blockAllocations[resourceId] > 0
    );

    const overallocatedResources = allocatedResources.filter(resourceId => {
      const resourceValidation = getResourceValidation(resourceId);
      return resourceValidation?.isOverallocated;
    });

    const totalHours = Object.values(blockAllocations).reduce((sum, hours) => sum + hours, 0);

    return {
      totalAllocatedHours: totalHours,
      allocatedResourceCount: allocatedResources.length,
      overallocatedResourceCount: overallocatedResources.length,
      hasConflicts: overallocatedResources.length > 0,
    };
  }, [validationResult, allocations, getResourceValidation]);

  // Helper function to get overall project validation summary
  const getProjectValidation = useCallback(() => {
    if (!validationResult) return null;

    const totalErrors = validationResult.errors.length;
    const totalWarnings = validationResult.warnings.length;
    const overallocatedResources = validationResult.resourceCapacities.filter(
      rc => rc.utilizationPercentage > 100
    ).length;

    return {
      isValid: validationResult.isValid,
      overallUtilization: validationResult.overallUtilization,
      totalErrors,
      totalWarnings,
      overallocatedResources,
      canProceed: totalErrors === 0,
      summary: generateValidationSummary(validationResult),
    };
  }, [validationResult]);

  return {
    validationResult,
    isValidating,
    getResourceValidation,
    getBlockValidation,
    getProjectValidation,
  };
}

function generateValidationSummary(result: CapacityValidationResult): string {
  if (result.isValid) {
    return 'All resource allocations are within capacity limits.';
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  if (errorCount > 0 && warningCount > 0) {
    return `${errorCount} error${errorCount > 1 ? 's' : ''} and ${warningCount} warning${warningCount > 1 ? 's' : ''} found.`;
  } else if (errorCount > 0) {
    return `${errorCount} error${errorCount > 1 ? 's' : ''} found. Please resolve before proceeding.`;
  } else if (warningCount > 0) {
    return `${warningCount} warning${warningCount > 1 ? 's' : ''} found. Review before proceeding.`;
  }

  return 'Validation completed.';
}