import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProjectTypeSchema } from '@/lib/validations/master-data';

// GET /api/master-data/project-types/[id] - Get a specific project type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectType = await prisma.projectType.findUnique({
      where: { id: params.id },
      include: {
        tiers: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!projectType) {
      return NextResponse.json(
        { error: 'Project type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(projectType);
  } catch (error) {
    console.error('Error fetching project type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project type' },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/project-types/[id] - Update a project type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = updateProjectTypeSchema.safeParse(body);
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

    // Check if project type exists
    const existingProjectType = await prisma.projectType.findUnique({
      where: { id: params.id },
    });

    if (!existingProjectType) {
      return NextResponse.json(
        { error: 'Project type not found' },
        { status: 404 }
      );
    }

    // Check if code already exists (if being updated)
    if (validationResult.data.code && validationResult.data.code !== existingProjectType.code) {
      const codeExists = await prisma.projectType.findUnique({
        where: { code: validationResult.data.code },
      });

      if (codeExists) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            validationErrors: [
              {
                field: 'code',
                message: 'A project type with this code already exists',
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Update the project type
    const projectType = await prisma.projectType.update({
      where: { id: params.id },
      data: validationResult.data,
    });

    return NextResponse.json(projectType);
  } catch (error) {
    console.error('Error updating project type:', error);
    return NextResponse.json(
      { error: 'Failed to update project type' },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/project-types/[id] - Delete a project type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if project type exists
    const existingProjectType = await prisma.projectType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existingProjectType) {
      return NextResponse.json(
        { error: 'Project type not found' },
        { status: 404 }
      );
    }

    // Check if project type is being used
    if (existingProjectType._count.projects > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete project type that is being used by projects',
          details: `This project type is used by ${existingProjectType._count.projects} project(s)`,
        },
        { status: 400 }
      );
    }

    // Delete the project type
    await prisma.projectType.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Project type deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project type:', error);
    return NextResponse.json(
      { error: 'Failed to delete project type' },
      { status: 500 }
    );
  }
}