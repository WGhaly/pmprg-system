import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProjectTypeSchema } from '@/lib/validations/master-data';
import { z } from 'zod';

// GET /api/master-data/project-types - List all project types
export async function GET() {
  try {
    const projectTypes = await prisma.projectType.findMany({
      orderBy: { name: 'asc' },
      include: {
        tiers: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return NextResponse.json(projectTypes);
  } catch (error) {
    console.error('Error fetching project types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project types' },
      { status: 500 }
    );
  }
}

// POST /api/master-data/project-types - Create a new project type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createProjectTypeSchema.safeParse(body);
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

    const { code, name, description, active } = validationResult.data;

    // Check if code already exists
    const existingProjectType = await prisma.projectType.findUnique({
      where: { code },
    });

    if (existingProjectType) {
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

    // Create the project type
    const projectType = await prisma.projectType.create({
      data: {
        code,
        name,
        description,
        active,
      },
    });

    return NextResponse.json(
      projectType,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project type:', error);
    return NextResponse.json(
      { error: 'Failed to create project type' },
      { status: 500 }
    );
  }
}