import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for allocation creation
const createAllocationSchema = z.object({
  projectBlockId: z.string().min(1, 'Project block ID is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  weekStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  allocatedHours: z.number().min(0, 'Allocated hours must be non-negative'),
});

// Validation schema for bulk allocation creation
const createBulkAllocationSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  allocations: z.array(z.object({
    projectBlockId: z.string().min(1, 'Project block ID is required'),
    resourceId: z.string().min(1, 'Resource ID is required'),
    allocatedHours: z.number().min(0, 'Allocated hours must be non-negative'),
    weeks: z.array(z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')),
  })),
});

// GET /api/allocations - List allocations with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const resourceId = searchParams.get('resourceId');
    const projectBlockId = searchParams.get('projectBlockId');

    const whereClause: any = {};
    
    if (projectBlockId) {
      whereClause.projectBlockId = projectBlockId;
    } else if (projectId) {
      whereClause.projectBlock = {
        projectId: projectId,
      };
    }
    
    if (resourceId) {
      whereClause.resourceId = resourceId;
    }

    const allocations = await prisma.allocation.findMany({
      where: whereClause,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            capacityHoursPerWeek: true,
          },
        },
        projectBlock: {
          include: {
            block: {
              select: { code: true, name: true },
            },
            project: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { weekStartDate: 'asc' },
        { resourceId: 'asc' },
      ],
    });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

// POST /api/allocations - Create new allocation(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a bulk allocation request
    if (body.projectId && body.allocations) {
      // Handle bulk allocation creation
      const validationResult = createBulkAllocationSchema.safeParse(body);
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

      const { projectId, allocations } = validationResult.data;

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { projectBlocks: true },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Create allocations in transaction
      const createdAllocations = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const allocation of allocations) {
          // Verify project block belongs to project
          const blockExists = project.projectBlocks.find(
            block => block.id === allocation.projectBlockId
          );
          
          if (!blockExists) {
            throw new Error(`Project block ${allocation.projectBlockId} not found in project ${projectId}`);
          }

          // Verify resource exists
          const resource = await tx.resource.findUnique({
            where: { id: allocation.resourceId },
          });

          if (!resource) {
            throw new Error(`Resource ${allocation.resourceId} not found`);
          }

          // Create allocations for each week
          for (const weekStart of allocation.weeks) {
            const existingAllocation = await tx.allocation.findUnique({
              where: {
                projectBlockId_resourceId_weekStartDate: {
                  projectBlockId: allocation.projectBlockId,
                  resourceId: allocation.resourceId,
                  weekStartDate: new Date(weekStart),
                },
              },
            });

            if (!existingAllocation) {
              const newAllocation = await tx.allocation.create({
                data: {
                  projectId: projectId,
                  projectBlockId: allocation.projectBlockId,
                  resourceId: allocation.resourceId,
                  weekStartDate: new Date(weekStart),
                  allocatedHours: allocation.allocatedHours,
                },
                include: {
                  resource: {
                    select: {
                      id: true,
                      name: true,
                      employeeCode: true,
                    },
                  },
                  projectBlock: {
                    include: {
                      block: {
                        select: { code: true, name: true },
                      },
                    },
                  },
                },
              });
              results.push(newAllocation);
            }
          }
        }
        
        return results;
      });

      return NextResponse.json(
        {
          message: `Created ${createdAllocations.length} allocations`,
          allocations: createdAllocations,
        },
        { status: 201 }
      );
    } else {
      // Handle single allocation creation
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

      const { projectBlockId, resourceId, weekStartDate, allocatedHours } = validationResult.data;

      // Check for existing allocation
      const existingAllocation = await prisma.allocation.findUnique({
        where: {
          projectBlockId_resourceId_weekStartDate: {
            projectBlockId,
            resourceId,
            weekStartDate: new Date(weekStartDate),
          },
        },
      });

      if (existingAllocation) {
        return NextResponse.json(
          { error: 'Allocation already exists for this resource, block, and week' },
          { status: 400 }
        );
      }

      // Get project ID from project block
      const projectBlock = await prisma.projectBlock.findUnique({
        where: { id: projectBlockId },
        select: { projectId: true },
      });

      if (!projectBlock) {
        return NextResponse.json(
          { error: 'Project block not found' },
          { status: 404 }
        );
      }

      // Create the allocation
      const allocation = await prisma.allocation.create({
        data: {
          projectId: projectBlock.projectId,
          projectBlockId,
          resourceId,
          weekStartDate: new Date(weekStartDate),
          allocatedHours,
        },
        include: {
          resource: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
            },
          },
          projectBlock: {
            include: {
              block: {
                select: { code: true, name: true },
              },
            },
          },
        },
      });

      return NextResponse.json(allocation, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}