import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for deliverable
const deliverableSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  qualityCriteria: z.string().optional(),
  acceptanceMetrics: z.string().optional(),
  blockId: z.string().min(1, 'Block is required'),
});

export async function GET() {
  try {
    const deliverables = await prisma.deliverable.findMany({
      include: {
        block: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { block: { code: 'asc' } },
        { code: 'asc' },
      ],
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = deliverableSchema.parse(body);

    // Check if code already exists
    const existingDeliverable = await prisma.deliverable.findUnique({
      where: { code: validatedData.code },
    });

    if (existingDeliverable) {
      return NextResponse.json(
        { error: 'A deliverable with this code already exists' },
        { status: 400 }
      );
    }

    // Verify block exists
    const block = await prisma.block.findUnique({
      where: { id: validatedData.blockId },
    });

    if (!block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 400 }
      );
    }

    const deliverable = await prisma.deliverable.create({
      data: validatedData,
      include: {
        block: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}