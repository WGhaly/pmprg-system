import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const skillRequirementSchema = z.object({
  skillId: z.string(),
  requiredLevel: z.number().min(1).max(10),
  requiredHours: z.number().positive(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});

const allocationRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectBlockId: z.string().min(1, 'Project Block ID is required'),
  startDate: z.string().datetime('Start date must be a valid ISO datetime'),
  endDate: z.string().datetime('End date must be a valid ISO datetime'),
  skillRequirements: z.array(skillRequirementSchema),
  preferences: z.object({
    preferredTeams: z.array(z.string()).optional(),
    excludeResources: z.array(z.string()).optional(),
    maxUtilizationPercentage: z.number().min(0).max(100).default(80),
    allowOverallocation: z.boolean().default(false),
    prioritizeSkillLevel: z.boolean().default(true),
    prioritizeAvailability: z.boolean().default(true),
  }).optional(),
});

const bulkAllocationSchema = z.object({
  allocations: z.array(z.object({
    resourceId: z.string(),
    weekStartDate: z.string().datetime(),
    allocatedHours: z.number().positive(),
  })),
  projectId: z.string(),
  projectBlockId: z.string(),
});

// POST /api/resources/allocation-engine - Find optimal resource allocation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = allocationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const preferences = data.preferences || {
      maxUtilizationPercentage: 80,
      allowOverallocation: false,
      prioritizeSkillLevel: true,
      prioritizeAvailability: true,
    };

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Calculate number of weeks
    const weeksDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Build resource filter
    const resourceWhere: any = {
      active: true,
    };

    if (preferences.preferredTeams && preferences.preferredTeams.length > 0) {
      resourceWhere.homeTeam = { in: preferences.preferredTeams };
    }

    if (preferences.excludeResources && preferences.excludeResources.length > 0) {
      resourceWhere.id = { notIn: preferences.excludeResources };
    }

    // Get all active resources with their skills
    const allResources = await prisma.resource.findMany({
      where: resourceWhere,
      include: {
        resourceSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    // Get existing allocations for the date range
    const existingAllocations = await prisma.allocation.findMany({
      where: {
        resourceId: { in: allResources.map(r => r.id) },
        weekStartDate: {
          gte: startDate,
          lt: endDate,
        }
      }
    });

    // Calculate weekly availability for each resource
    const resourceAvailability = allResources.map(resource => {
      const weeklyAllocations: { [key: string]: number } = {};
      
      // Calculate existing allocations per week
      const current = new Date(startDate);
      while (current < endDate) {
        const weekKey = current.toISOString().split('T')[0];
        const weekAllocations = existingAllocations.filter(alloc => 
          alloc.resourceId === resource.id && 
          alloc.weekStartDate.toISOString().split('T')[0] === weekKey
        );
        
        weeklyAllocations[weekKey] = weekAllocations.reduce((sum, alloc) => 
          sum + alloc.allocatedHours, 0
        );
        
        current.setDate(current.getDate() + 7);
      }

      return {
        resource,
        weeklyAllocations,
        skills: resource.resourceSkills.map((rs: any) => ({
          skillId: rs.skillId,
          skillCode: rs.skill.code,
          skillName: rs.skill.name,
          skillCategory: rs.skill.category,
          level: rs.level,
        })),
      };
    });

    // Find matching resources for each skill requirement
    const skillMatches = data.skillRequirements.map(requirement => {
      const matchingResources = resourceAvailability
        .filter(ra => {
          // Check if resource has the required skill
          const resourceSkill = ra.skills.find(skill => skill.skillId === requirement.skillId);
          if (!resourceSkill) return false;
          
          // Check skill level requirement
          if (resourceSkill.level < requirement.requiredLevel) return false;
          
          return true;
        })
        .map(ra => {
          const resourceSkill = ra.skills.find(skill => skill.skillId === requirement.skillId)!;
          
          // Calculate skill score (higher is better)
          const skillScore = preferences.prioritizeSkillLevel 
            ? resourceSkill.level / 10 * 100  // Normalize to 0-100
            : 50; // Default score if not prioritizing skill level
          
          // Calculate availability score across all weeks
          let totalAvailableHours = 0;
          let availabilityScore = 0;
          
          const current = new Date(startDate);
          let weekCount = 0;
          
          while (current < endDate) {
            const weekKey = current.toISOString().split('T')[0];
            const allocatedHours = ra.weeklyAllocations[weekKey] || 0;
            const availableHours = Math.max(0, ra.resource.capacityHoursPerWeek - allocatedHours);
            const utilizationPercentage = (allocatedHours / ra.resource.capacityHoursPerWeek) * 100;
            
            totalAvailableHours += availableHours;
            
            // Penalize high utilization
            if (utilizationPercentage > preferences.maxUtilizationPercentage && !preferences.allowOverallocation) {
              availabilityScore -= 20; // Penalty for over-utilization
            } else {
              availabilityScore += Math.min(availableHours / ra.resource.capacityHoursPerWeek * 100, 100);
            }
            
            current.setDate(current.getDate() + 7);
            weekCount++;
          }
          
          availabilityScore = weekCount > 0 ? availabilityScore / weekCount : 0;
          
          // Calculate composite score
          const compositeScore = preferences.prioritizeAvailability 
            ? (skillScore * 0.3) + (availabilityScore * 0.7)
            : (skillScore * 0.7) + (availabilityScore * 0.3);
          
          return {
            resourceId: ra.resource.id,
            resourceName: ra.resource.name,
            employeeCode: ra.resource.employeeCode,
            homeTeam: ra.resource.homeTeam,
            capacityHoursPerWeek: ra.resource.capacityHoursPerWeek,
            skillLevel: resourceSkill.level,
            totalAvailableHours,
            averageAvailabilityScore: Math.round(availabilityScore * 100) / 100,
            skillScore: Math.round(skillScore * 100) / 100,
            compositeScore: Math.round(compositeScore * 100) / 100,
            weeklyAvailability: Object.keys(ra.weeklyAllocations).map(weekKey => ({
              weekStartDate: weekKey,
              allocatedHours: ra.weeklyAllocations[weekKey] || 0,
              availableHours: Math.max(0, ra.resource.capacityHoursPerWeek - (ra.weeklyAllocations[weekKey] || 0)),
              utilization: Math.round(((ra.weeklyAllocations[weekKey] || 0) / ra.resource.capacityHoursPerWeek) * 100 * 100) / 100,
            })),
          };
        })
        .sort((a, b) => b.compositeScore - a.compositeScore); // Sort by best match first

      return {
        requirement,
        matchingResources,
        canBeFulfilled: matchingResources.some(match => 
          match.totalAvailableHours >= requirement.requiredHours
        ),
        bestMatch: matchingResources[0] || null,
      };
    });

    // Generate allocation recommendations
    const allocationPlan = [];
    const resourceUtilization: { [key: string]: { [key: string]: number } } = {};

    for (const skillMatch of skillMatches) {
      if (!skillMatch.bestMatch) {
        continue; // Skip if no matching resources found
      }

      const resource = skillMatch.bestMatch;
      const requirement = skillMatch.requirement;
      
      // Initialize resource utilization tracking
      if (!resourceUtilization[resource.resourceId]) {
        resourceUtilization[resource.resourceId] = {};
      }

      // Distribute hours across weeks
      const hoursPerWeek = Math.ceil(requirement.requiredHours / weeksDuration);
      const current = new Date(startDate);
      
      while (current < endDate) {
        const weekKey = current.toISOString().split('T')[0];
        
        // Get current utilization for this resource in this week
        const currentWeekUtilization = resourceUtilization[resource.resourceId][weekKey] || 0;
        const baseUtilization = resource.weeklyAvailability.find(w => w.weekStartDate === weekKey)?.allocatedHours || 0;
        const totalCurrentUtilization = currentWeekUtilization + baseUtilization;
        
        // Calculate how many hours we can allocate this week
        const maxAllowableHours = preferences.allowOverallocation 
          ? resource.capacityHoursPerWeek * 1.2 // Allow 20% overallocation
          : resource.capacityHoursPerWeek;
        
        const availableThisWeek = Math.max(0, maxAllowableHours - totalCurrentUtilization);
        const hoursToAllocate = Math.min(hoursPerWeek, availableThisWeek);
        
        if (hoursToAllocate > 0) {
          allocationPlan.push({
            resourceId: resource.resourceId,
            resourceName: resource.resourceName,
            employeeCode: resource.employeeCode,
            homeTeam: resource.homeTeam,
            skillId: requirement.skillId,
            skillName: skillMatch.requirement.skillId, // Will be resolved with skill name in response
            requiredLevel: requirement.requiredLevel,
            resourceSkillLevel: resource.skillLevel,
            priority: requirement.priority,
            weekStartDate: new Date(current),
            allocatedHours: hoursToAllocate,
            utilizationAfterAllocation: Math.round(((totalCurrentUtilization + hoursToAllocate) / resource.capacityHoursPerWeek) * 100 * 100) / 100,
            isOverallocation: (totalCurrentUtilization + hoursToAllocate) > resource.capacityHoursPerWeek,
          });
          
          // Update resource utilization tracking
          resourceUtilization[resource.resourceId][weekKey] = currentWeekUtilization + hoursToAllocate;
        }
        
        current.setDate(current.getDate() + 7);
      }
    }

    // Calculate allocation summary
    const totalRequiredHours = data.skillRequirements.reduce((sum, req) => sum + req.requiredHours, 0);
    const totalAllocatedHours = allocationPlan.reduce((sum, allocation) => sum + allocation.allocatedHours, 0);
    const fulfillmentPercentage = totalRequiredHours > 0 
      ? Math.round((totalAllocatedHours / totalRequiredHours) * 100 * 100) / 100
      : 0;

    const uniqueResources = [...new Set(allocationPlan.map(a => a.resourceId))];
    const overAllocations = allocationPlan.filter(a => a.isOverallocation);

    const responseData = {
      request: {
        projectId: data.projectId,
        projectBlockId: data.projectBlockId,
        startDate,
        endDate,
        weeksDuration,
        skillRequirements: data.skillRequirements,
        preferences,
      },
      analysis: {
        totalRequiredHours,
        totalAllocatedHours,
        fulfillmentPercentage,
        uniqueResourcesNeeded: uniqueResources.length,
        hasOverAllocations: overAllocations.length > 0,
        overAllocationCount: overAllocations.length,
        canFullyFulfill: fulfillmentPercentage >= 95,
      },
      skillMatches,
      allocationPlan,
      warnings: [
        ...(overAllocations.length > 0 ? [`${overAllocations.length} allocations would result in over-utilization`] : []),
        ...(fulfillmentPercentage < 100 ? [`Only ${fulfillmentPercentage}% of required hours can be allocated`] : []),
        ...(skillMatches.some(sm => !sm.canBeFulfilled) ? ['Some skill requirements cannot be fulfilled with available resources'] : []),
      ],
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in allocation engine:', error);
    return NextResponse.json(
      { error: 'Failed to generate allocation recommendations' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/allocation-engine - Apply allocation recommendations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = bulkAllocationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Apply allocations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdAllocations = [];
      
      for (const allocation of data.allocations) {
        // Check if allocation already exists
        const existingAllocation = await tx.allocation.findUnique({
          where: {
            projectBlockId_resourceId_weekStartDate: {
              projectBlockId: data.projectBlockId,
              resourceId: allocation.resourceId,
              weekStartDate: new Date(allocation.weekStartDate),
            }
          }
        });

        if (existingAllocation) {
          // Update existing allocation
          const updated = await tx.allocation.update({
            where: { id: existingAllocation.id },
            data: {
              allocatedHours: allocation.allocatedHours,
            },
            include: {
              resource: true,
              projectBlock: {
                include: {
                  project: true,
                  block: true,
                }
              }
            }
          });
          createdAllocations.push(updated);
        } else {
          // Create new allocation
          const created = await tx.allocation.create({
            data: {
              projectId: data.projectId,
              projectBlockId: data.projectBlockId,
              resourceId: allocation.resourceId,
              weekStartDate: new Date(allocation.weekStartDate),
              allocatedHours: allocation.allocatedHours,
            },
            include: {
              resource: true,
              projectBlock: {
                include: {
                  project: true,
                  block: true,
                }
              }
            }
          });
          createdAllocations.push(created);
        }
      }
      
      return createdAllocations;
    });

    const responseData = {
      message: 'Allocations applied successfully',
      allocationsCreated: result.length,
      allocations: result.map(allocation => ({
        id: allocation.id,
        resourceId: allocation.resourceId,
        resourceName: allocation.resource.name,
        projectId: allocation.projectId,
        projectName: allocation.projectBlock.project.name,
        blockName: allocation.projectBlock.block.name,
        weekStartDate: allocation.weekStartDate,
        allocatedHours: allocation.allocatedHours,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error applying allocations:', error);
    return NextResponse.json(
      { error: 'Failed to apply allocations' },
      { status: 500 }
    );
  }
}