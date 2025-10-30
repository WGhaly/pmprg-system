import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createAllocationSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectBlockId: z.string().min(1, 'Project Block ID is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  weekStartDate: z.string().datetime('Week start date must be a valid ISO datetime'),
  allocatedHours: z.number().positive('Allocated hours must be positive'),
});

const updateAllocationSchema = createAllocationSchema.partial();

// GET /api/resources/allocations - Retrieve resource allocations with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const projectId = searchParams.get('projectId');
    const projectBlockId = searchParams.get('projectBlockId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeResource = searchParams.get('includeResource') === 'true';
    const includeProject = searchParams.get('includeProject') === 'true';
    const includeProjectBlock = searchParams.get('includeProjectBlock') === 'true';

    // Build where clause for filtering
    const where: any = {};
    
    if (resourceId) {
      where.resourceId = resourceId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }

    if (projectBlockId) {
      where.projectBlockId = projectBlockId;
    }

    // Date range filtering
    if (startDate || endDate) {
      if (startDate) {
        where.weekStartDate = {
          gte: new Date(startDate)
        };
      }
      
      if (endDate) {
        where.weekStartDate = {
          ...where.weekStartDate,
          lte: new Date(endDate)
        };
      }
    }

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        resource: includeResource,
        projectBlock: includeProjectBlock ? {
          include: {
            project: includeProject,
            block: true,
          }
        } : false,
      },
      orderBy: [
        { weekStartDate: 'asc' },
        { resourceId: 'asc' }
      ],
    });

    // Calculate allocation metrics
    const allocationsWithMetrics = allocations.map((allocation: any) => {
      const weekEndDate = new Date(allocation.weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      return {
        ...allocation,
        derivedMetrics: {
          weekEndDate,
          utilizationPercentage: allocation.resource?.capacityHoursPerWeek 
            ? Math.round((allocation.allocatedHours / allocation.resource.capacityHoursPerWeek) * 100 * 100) / 100
            : null,
        },
      };
    });

    return NextResponse.json(allocationsWithMetrics);
  } catch (error) {
    console.error('Error fetching resource allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource allocations' },
      { status: 500 }
    );
  }
}

// POST /api/resources/allocations - Create a new resource allocation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createAllocationSchema.safeParse(body);
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

    // Check if allocation already exists for this resource/project block/week
    const existingAllocation = await prisma.allocation.findUnique({
      where: {
        projectBlockId_resourceId_weekStartDate: {
          projectBlockId: data.projectBlockId,
          resourceId: data.resourceId,
          weekStartDate: new Date(data.weekStartDate),
        }
      }
    });

    if (existingAllocation) {
      return NextResponse.json(
        { error: 'Allocation already exists for this resource/project block/week combination' },
        { status: 409 }
      );
    }

    // Get resource capacity to validate allocation
    const resource = await prisma.resource.findUnique({
      where: { id: data.resourceId }
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check total weekly allocation for this resource
    const weekStart = new Date(data.weekStartDate);
    const existingWeeklyAllocations = await prisma.allocation.findMany({
      where: {
        resourceId: data.resourceId,
        weekStartDate: weekStart,
      }
    });

    const totalAllocatedHours = existingWeeklyAllocations.reduce((sum: number, allocation: any) => {
      return sum + allocation.allocatedHours;
    }, 0);

    if (totalAllocatedHours + data.allocatedHours > resource.capacityHoursPerWeek) {
      return NextResponse.json(
        { 
          error: 'Resource over-allocation', 
          message: `Adding ${data.allocatedHours}h would exceed capacity. Current: ${totalAllocatedHours}h, Capacity: ${resource.capacityHoursPerWeek}h`,
          currentAllocation: totalAllocatedHours,
          capacity: resource.capacityHoursPerWeek,
          requestedHours: data.allocatedHours,
        },
        { status: 409 }
      );
    }

    // Create the allocation
    const newAllocation = await prisma.allocation.create({
      data: {
        projectId: data.projectId,
        projectBlockId: data.projectBlockId,
        resourceId: data.resourceId,
        weekStartDate: new Date(data.weekStartDate),
        allocatedHours: data.allocatedHours,
      },
      include: {
        resource: true,
        projectBlock: {
          include: {
            project: true,
            block: true,
          }
        },
      },
    });

    // Calculate derived metrics
    const weekEndDate = new Date(newAllocation.weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const utilizationPercentage = Math.round((newAllocation.allocatedHours / resource.capacityHoursPerWeek) * 100 * 100) / 100;

    const responseData = {
      ...newAllocation,
      derivedMetrics: {
        weekEndDate,
        utilizationPercentage,
      },
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating resource allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create resource allocation' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/allocations - Update a resource allocation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Validate the input
    const validationResult = updateAllocationSchema.safeParse(updateData);
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

    // Get existing allocation
    const existingAllocation = await prisma.allocation.findUnique({
      where: { id },
      include: { resource: true }
    });

    if (!existingAllocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Update the allocation
    const updatedAllocation = await prisma.allocation.update({
      where: { id },
      data: {
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.projectBlockId && { projectBlockId: data.projectBlockId }),
        ...(data.resourceId && { resourceId: data.resourceId }),
        ...(data.weekStartDate && { weekStartDate: new Date(data.weekStartDate) }),
        ...(data.allocatedHours && { allocatedHours: data.allocatedHours }),
      },
      include: {
        resource: true,
        projectBlock: {
          include: {
            project: true,
            block: true,
          }
        },
      },
    });

    // Calculate derived metrics
    const weekEndDate = new Date(updatedAllocation.weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const utilizationPercentage = updatedAllocation.resource 
      ? Math.round((updatedAllocation.allocatedHours / updatedAllocation.resource.capacityHoursPerWeek) * 100 * 100) / 100
      : null;

    const responseData = {
      ...updatedAllocation,
      derivedMetrics: {
        weekEndDate,
        utilizationPercentage,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating resource allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update resource allocation' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/allocations - Delete a resource allocation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    await prisma.allocation.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Resource allocation deleted successfully',
      allocationId: id,
    });
  } catch (error) {
    console.error('Error deleting resource allocation:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete resource allocation' },
      { status: 500 }
    );
  }
}