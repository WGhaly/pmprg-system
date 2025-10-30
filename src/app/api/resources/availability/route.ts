import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const getAvailabilitySchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  startDate: z.string().datetime('Start date must be a valid ISO datetime'),
  endDate: z.string().datetime('End date must be a valid ISO datetime'),
});

// GET /api/resources/availability - Get resource availability for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!resourceId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'resourceId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Validate the input
    const validationResult = getAvailabilitySchema.safeParse({
      resourceId,
      startDate,
      endDate,
    });

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

    // Get resource details
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        resourceSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Get all allocations for the resource in the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const allocations = await prisma.allocation.findMany({
      where: {
        resourceId: resourceId,
        weekStartDate: {
          gte: start,
          lte: end,
        }
      },
      include: {
        projectBlock: {
          include: {
            project: true,
            block: true,
          }
        }
      },
      orderBy: {
        weekStartDate: 'asc'
      }
    });

    // Generate weekly availability data
    const weeklyAvailability = [];
    const current = new Date(start);
    
    // Round down to the start of the week (Monday)
    current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
    
    while (current <= end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Find allocations for this week
      const weekAllocations = allocations.filter(allocation => 
        allocation.weekStartDate.getTime() === weekStart.getTime()
      );
      
      const totalAllocatedHours = weekAllocations.reduce((sum, allocation) => 
        sum + allocation.allocatedHours, 0
      );
      
      const availableHours = resource.capacityHoursPerWeek - totalAllocatedHours;
      const utilizationPercentage = Math.round((totalAllocatedHours / resource.capacityHoursPerWeek) * 100 * 100) / 100;
      
      weeklyAvailability.push({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        capacityHours: resource.capacityHoursPerWeek,
        allocatedHours: totalAllocatedHours,
        availableHours: Math.max(0, availableHours),
        utilizationPercentage,
        isOverallocated: totalAllocatedHours > resource.capacityHoursPerWeek,
        allocations: weekAllocations.map(allocation => ({
          id: allocation.id,
          projectId: allocation.projectId,
          projectName: allocation.projectBlock.project.name,
          blockName: allocation.projectBlock.block.name,
          allocatedHours: allocation.allocatedHours,
        })),
      });
      
      // Move to next week
      current.setDate(current.getDate() + 7);
    }

    // Calculate summary metrics
    const totalCapacityHours = weeklyAvailability.length * resource.capacityHoursPerWeek;
    const totalAllocatedHours = weeklyAvailability.reduce((sum, week) => sum + week.allocatedHours, 0);
    const totalAvailableHours = Math.max(0, totalCapacityHours - totalAllocatedHours);
    const averageUtilization = weeklyAvailability.length > 0 
      ? Math.round((totalAllocatedHours / totalCapacityHours) * 100 * 100) / 100
      : 0;

    const overallocatedWeeks = weeklyAvailability.filter(week => week.isOverallocated).length;

    const responseData = {
      resource: {
        id: resource.id,
        name: resource.name,
        employeeCode: resource.employeeCode,
        homeTeam: resource.homeTeam,
        capacityHoursPerWeek: resource.capacityHoursPerWeek,
        skills: resource.resourceSkills.map((rs: any) => ({
          skillId: rs.skillId,
          skillCode: rs.skill?.code || '',
          skillName: rs.skill?.name || '',
          skillCategory: rs.skill?.category || '',
          level: rs.level,
        })),
      },
      dateRange: {
        startDate: start,
        endDate: end,
        totalWeeks: weeklyAvailability.length,
      },
      summary: {
        totalCapacityHours,
        totalAllocatedHours,
        totalAvailableHours,
        averageUtilization,
        overallocatedWeeks,
        isFullyAllocated: totalAvailableHours === 0,
        hasOverallocation: overallocatedWeeks > 0,
      },
      weeklyAvailability,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching resource availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource availability' },
      { status: 500 }
    );
  }
}

// POST /api/resources/availability - Get availability for multiple resources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceIds, startDate, endDate, skillFilters } = body;

    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json(
        { error: 'resourceIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Build resource filter
    const resourceWhere: any = {
      id: { in: resourceIds },
      active: true,
    };

    // Add skill filters if provided
    if (skillFilters && skillFilters.length > 0) {
      resourceWhere.resourceSkills = {
        some: {
          skillId: { in: skillFilters }
        }
      };
    }

    // Get resources
    const resources = await prisma.resource.findMany({
      where: resourceWhere,
      include: {
        resourceSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (resources.length === 0) {
      return NextResponse.json({
        resources: [],
        summary: {
          totalResources: 0,
          totalCapacityHours: 0,
          totalAllocatedHours: 0,
          totalAvailableHours: 0,
          averageUtilization: 0,
        }
      });
    }

    // Get all allocations for these resources in the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const allocations = await prisma.allocation.findMany({
      where: {
        resourceId: { in: resourceIds },
        weekStartDate: {
          gte: start,
          lte: end,
        }
      },
      include: {
        projectBlock: {
          include: {
            project: true,
            block: true,
          }
        }
      }
    });

    // Calculate availability for each resource
    const resourceAvailability = resources.map(resource => {
      const resourceAllocations = allocations.filter(alloc => alloc.resourceId === resource.id);
      
      // Calculate weekly data
      let totalAllocatedHours = 0;
      const current = new Date(start);
      const weekCount = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      resourceAllocations.forEach(allocation => {
        totalAllocatedHours += allocation.allocatedHours;
      });

      const totalCapacityHours = weekCount * resource.capacityHoursPerWeek;
      const totalAvailableHours = Math.max(0, totalCapacityHours - totalAllocatedHours);
      const utilizationPercentage = totalCapacityHours > 0 
        ? Math.round((totalAllocatedHours / totalCapacityHours) * 100 * 100) / 100
        : 0;

      return {
        resource: {
          id: resource.id,
          name: resource.name,
          employeeCode: resource.employeeCode,
          homeTeam: resource.homeTeam,
          capacityHoursPerWeek: resource.capacityHoursPerWeek,
          skills: resource.resourceSkills.map((rs: any) => ({
            skillId: rs.skillId,
            skillCode: rs.skill?.code || '',
            skillName: rs.skill?.name || '',
            skillCategory: rs.skill?.category || '',
            level: rs.level,
          })),
        },
        allocation: {
          totalCapacityHours,
          totalAllocatedHours,
          totalAvailableHours,
          utilizationPercentage,
          isOverallocated: totalAllocatedHours > totalCapacityHours,
          isAvailable: totalAvailableHours > 0,
        },
      };
    });

    // Calculate overall summary
    const summary = {
      totalResources: resources.length,
      totalCapacityHours: resourceAvailability.reduce((sum, res) => sum + res.allocation.totalCapacityHours, 0),
      totalAllocatedHours: resourceAvailability.reduce((sum, res) => sum + res.allocation.totalAllocatedHours, 0),
      totalAvailableHours: resourceAvailability.reduce((sum, res) => sum + res.allocation.totalAvailableHours, 0),
      averageUtilization: resourceAvailability.length > 0 
        ? Math.round((resourceAvailability.reduce((sum, res) => sum + res.allocation.utilizationPercentage, 0) / resourceAvailability.length) * 100) / 100
        : 0,
      availableResources: resourceAvailability.filter(res => res.allocation.isAvailable).length,
      overallocatedResources: resourceAvailability.filter(res => res.allocation.isOverallocated).length,
    };

    return NextResponse.json({
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary,
      resources: resourceAvailability,
    });
  } catch (error) {
    console.error('Error fetching multi-resource availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource availability' },
      { status: 500 }
    );
  }
}