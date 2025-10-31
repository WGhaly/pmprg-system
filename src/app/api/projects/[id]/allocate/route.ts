import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/projects/[id]/allocate - Auto-allocate resources to project blocks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;

    // Get project with blocks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectBlocks: {
          include: {
            block: {
              select: { code: true, name: true, defaultSkillsMix: true },
            },
          },
          orderBy: { sequenceIndex: 'asc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all active resources
    const resources = await prisma.resource.findMany({
      where: { active: true },
      include: {
        resourceSkills: {
          include: {
            skill: {
              select: { code: true, name: true, category: true },
            },
          },
        },
      },
    });

    if (resources.length === 0) {
      return NextResponse.json(
        { error: 'No active resources available' },
        { status: 400 }
      );
    }

    // Simple allocation logic: distribute work evenly across available resources
    const allocationsToCreate: Array<{
      projectBlockId: string;
      resourceId: string;
      allocatedHours: number;
      weeks: string[];
    }> = [];
    const hoursPerResourcePerWeek = 20; // Default allocation

    for (const projectBlock of project.projectBlocks) {
      const blockStart = new Date(projectBlock.plannedStart);
      const blockEnd = new Date(projectBlock.plannedEnd);
      
      // Calculate number of weeks
      const weeks = Math.ceil((blockEnd.getTime() - blockStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // For simplicity, assign a few resources to each block
      const selectedResources = resources.slice(0, Math.min(3, resources.length)); // Max 3 resources per block
      
      for (const resource of selectedResources) {
        const weekDates = [];
        
        // Generate week start dates
        for (let week = 0; week < weeks; week++) {
          const weekStart = new Date(blockStart);
          weekStart.setDate(weekStart.getDate() + (week * 7));
          weekDates.push(weekStart.toISOString().split('T')[0]);
        }
        
        allocationsToCreate.push({
          projectBlockId: projectBlock.id,
          resourceId: resource.id,
          allocatedHours: hoursPerResourcePerWeek,
          weeks: weekDates,
        });
      }
    }

    // Prepare all allocation records to create
    const allocationRecords: Array<{
      projectId: string;
      projectBlockId: string;
      resourceId: string;
      weekStartDate: Date;
      allocatedHours: number;
    }> = [];
    
    for (const allocation of allocationsToCreate) {
      for (const weekStart of allocation.weeks) {
        allocationRecords.push({
          projectId: projectId,
          projectBlockId: allocation.projectBlockId,
          resourceId: allocation.resourceId,
          weekStartDate: new Date(weekStart),
          allocatedHours: allocation.allocatedHours,
        });
      }
    }

    // Use bulk insert with createMany for better performance
    const createdAllocations = await prisma.$transaction(async (tx) => {
      // Delete any existing allocations for this project first
      await tx.allocation.deleteMany({
        where: { projectId: projectId },
      });

      // Create all allocations in bulk
      await tx.allocation.createMany({
        data: allocationRecords,
      });

      // Fetch the created allocations with relations for response
      const results = await tx.allocation.findMany({
        where: { projectId: projectId },
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
      
      return results;
    }, { timeout: 10000 }); // Increase timeout to 10 seconds

    return NextResponse.json({
      message: 'Resources successfully allocated to project',
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
      },
      allocations: createdAllocations,
    });

  } catch (error) {
    console.error('Error auto-allocating resources:', error);
    return NextResponse.json(
      { error: 'Failed to allocate resources' },
      { status: 500 }
    );
  }
}