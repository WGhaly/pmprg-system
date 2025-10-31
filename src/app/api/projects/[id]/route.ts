import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for project updates
const updateProjectSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  clientType: z.string().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  targetStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  budgetCapex: z.number().optional(),
  budgetOpex: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectType: {
          select: { code: true, name: true },
        },
        tier: {
          select: { code: true, name: true },
        },
        projectBlocks: {
          include: {
            block: {
              select: { code: true, name: true },
            },
            allocations: {
              include: {
                resource: {
                  select: { id: true, name: true, employeeCode: true },
                },
              },
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

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a specific project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate the input
    const validationResult = updateProjectSchema.safeParse(body);
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

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If changing code, check for conflicts
    if (validationResult.data.code && validationResult.data.code !== existingProject.code) {
      const codeConflict = await prisma.project.findUnique({
        where: { code: validationResult.data.code },
      });

      if (codeConflict) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            validationErrors: [
              {
                field: 'code',
                message: 'A project with this code already exists',
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    Object.keys(validationResult.data).forEach(key => {
      const value = (validationResult.data as any)[key];
      if (value !== undefined) {
        if (key === 'targetStartDate') {
          updateData[key] = new Date(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        projectType: {
          select: { code: true, name: true },
        },
        tier: {
          select: { code: true, name: true },
        },
        projectBlocks: {
          include: {
            block: {
              select: { code: true, name: true },
            },
            allocations: {
              include: {
                resource: {
                  select: { id: true, name: true, employeeCode: true },
                },
              },
            },
          },
          orderBy: { sequenceIndex: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete allocations first
      await tx.allocation.deleteMany({
        where: {
          projectBlock: {
            projectId: id,
          },
        },
      });

      // Delete project blocks
      await tx.projectBlock.deleteMany({
        where: { projectId: id },
      });

      // Delete the project
      await tx.project.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}