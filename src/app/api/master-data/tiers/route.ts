import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTierSchema } from '@/lib/validations/master-data';

// GET /api/master-data/tiers - List all tiers
export async function GET() {
  try {
    const tiers = await prisma.tier.findMany({
      orderBy: { name: 'asc' },
      include: {
        projectType: {
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

    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiers' },
      { status: 500 }
    );
  }
}

// POST /api/master-data/tiers - Create a new tier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createTierSchema.safeParse(body);
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

    const { code, name, description, sizeHint, projectTypeId } = validationResult.data;

    // Check if code already exists for this project type
    const existingTier = await prisma.tier.findFirst({
      where: { 
        code,
        projectTypeId,
      },
    });

    if (existingTier) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: [
            {
              field: 'code',
              message: 'A tier with this code already exists for this project type',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create the tier
    const tier = await prisma.tier.create({
      data: {
        code,
        name,
        description,
        sizeHint,
        projectTypeId,
      },
      include: {
        projectType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      tier,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json(
      { error: 'Failed to create tier' },
      { status: 500 }
    );
  }
}