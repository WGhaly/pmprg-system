import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allocations, timeframe, validationId } = body;

    // Validate input
    if (!allocations || !timeframe || !timeframe.startDate || !timeframe.endDate) {
      return NextResponse.json(
        { error: 'Invalid input data provided' },
        { status: 400 }
      );
    }

    const validationResult = await validateResourceCapacity(
      allocations as AllocationData,
      timeframe as ProjectTimeframe
    );

    return NextResponse.json({
      ...validationResult,
      validationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error validating resource capacity:', error);
    return NextResponse.json(
      { error: 'Failed to validate resource capacity' },
      { status: 500 }
    );
  }
}

async function validateResourceCapacity(
  allocations: AllocationData,
  timeframe: ProjectTimeframe
): Promise<CapacityValidationResult> {
  
  // Extract all unique resource IDs from allocations
  const resourceIds = Array.from(
    new Set(
      Object.values(allocations).flatMap(blockAllocations =>
        Object.keys(blockAllocations).filter(resourceId => 
          blockAllocations[resourceId] > 0
        )
      )
    )
  );

  if (resourceIds.length === 0) {
    return {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: [],
      resourceCapacities: [],
      overallUtilization: 0,
    };
  }

  // Get resource information
  const resources = await prisma.resource.findMany({
    where: {
      id: { in: resourceIds },
      active: true,
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      homeTeam: true,
      capacityHoursPerWeek: true,
    },
  });

  // Get existing allocations for the timeframe
  const existingAllocations = await prisma.allocation.findMany({
    where: {
      resourceId: { in: resourceIds },
      weekStartDate: {
        gte: new Date(timeframe.startDate),
        lte: new Date(timeframe.endDate),
      },
    },
    select: {
      resourceId: true,
      allocatedHours: true,
      weekStartDate: true,
      projectBlock: {
        select: {
          project: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  // Calculate timeframe duration in weeks
  const startDate = new Date(timeframe.startDate);
  const endDate = new Date(timeframe.endDate);
  const durationWeeks = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const standardWeeklyHours = 40;
  const maxCapacityPerResource = durationWeeks * standardWeeklyHours;

  // Build capacity analysis for each resource
  const resourceCapacities: ResourceCapacity[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  for (const resourceId of resourceIds) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) {
      errors.push(`Resource ${resourceId} not found or inactive`);
      continue;
    }

    // Calculate current allocation for this resource across all blocks
    const newAllocationHours = Object.values(allocations).reduce((total, blockAllocations) => {
      return total + (blockAllocations[resourceId] || 0);
    }, 0);

    // Calculate existing allocation overlap
    const existingAllocationHours = existingAllocations
      .filter((alloc: any) => alloc.resourceId === resourceId)
      .reduce((total: number, alloc: any) => total + alloc.allocatedHours, 0);

    const totalAllocatedHours = newAllocationHours + existingAllocationHours;
    const utilizationPercentage = (totalAllocatedHours / maxCapacityPerResource) * 100;
    const availableHours = Math.max(0, maxCapacityPerResource - existingAllocationHours);

    // Detect conflicts
    const conflicts: ResourceCapacity['conflicts'] = [];
    const recommendations: string[] = [];

    // Overallocation detection
    if (utilizationPercentage > 100) {
      const overageHours = totalAllocatedHours - maxCapacityPerResource;
      conflicts.push({
        type: 'overallocation',
        severity: overageHours > maxCapacityPerResource * 0.2 ? 'high' : 'medium',
        description: `Overallocated by ${Math.round(overageHours)} hours (${Math.round(utilizationPercentage - 100)}% over capacity)`,
        period: `${timeframe.startDate} - ${timeframe.endDate}`,
      });
      
      errors.push(`${resource.name} is overallocated by ${Math.round(overageHours)} hours`);
      recommendations.push(`Reduce allocation by ${Math.round(overageHours)} hours or extend timeline`);
    } else if (utilizationPercentage > 90) {
      conflicts.push({
        type: 'overallocation',
        severity: 'low',
        description: `High utilization (${Math.round(utilizationPercentage)}%)`,
        period: `${timeframe.startDate} - ${timeframe.endDate}`,
      });
      
      warnings.push(`${resource.name} has high utilization (${Math.round(utilizationPercentage)}%)`);
      recommendations.push('Consider adding buffer time or reducing allocation slightly');
    }

    // Project overlap detection
    const overlappingProjects = existingAllocations
      .filter((alloc: any) => alloc.resourceId === resourceId)
      .map((alloc: any) => alloc.projectBlock.project);

    if (overlappingProjects.length > 0) {
      conflicts.push({
        type: 'project_overlap',
        severity: overlappingProjects.length > 2 ? 'high' : 'medium',
        description: `Concurrent assignments to ${overlappingProjects.length} other project(s): ${overlappingProjects.map((p: any) => p.name).join(', ')}`,
        period: `${timeframe.startDate} - ${timeframe.endDate}`,
      });
      
      if (overlappingProjects.length > 2) {
        warnings.push(`${resource.name} is assigned to ${overlappingProjects.length} concurrent projects`);
        recommendations.push('Consider reducing concurrent project assignments for better focus');
      }
    }

    // Optimal utilization recommendations
    if (utilizationPercentage < 60 && newAllocationHours > 0) {
      recommendations.push(`${resource.name} is underutilized (${Math.round(utilizationPercentage)}%) - consider increasing allocation`);
    }

    resourceCapacities.push({
      resourceId,
      availableHours,
      totalCapacity: maxCapacityPerResource,
      utilizationPercentage,
      conflicts,
      recommendations,
    });
  }

  // Calculate overall project utilization
  const totalRequiredHours = Object.values(allocations).reduce((total, blockAllocations) => {
    return total + Object.values(blockAllocations).reduce((blockTotal, hours) => blockTotal + hours, 0);
  }, 0);

  const totalAvailableCapacity = resourceIds.length * maxCapacityPerResource;
  const overallUtilization = (totalRequiredHours / totalAvailableCapacity) * 100;

  // Generate project-level suggestions
  if (overallUtilization < 50) {
    suggestions.push('Project is under-utilizing team capacity. Consider adding more features or reducing team size.');
  } else if (overallUtilization > 90) {
    suggestions.push('Project is near capacity limits. Consider extending timeline or adding resources.');
  }

  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push('Resource allocation looks optimal for the project timeline.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
    resourceCapacities,
    overallUtilization,
  };
}