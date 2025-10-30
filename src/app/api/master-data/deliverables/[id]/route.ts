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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = deliverableSchema.parse(body);

    // Check if deliverable exists
    const existingDeliverable = await prisma.deliverable.findUnique({
      where: { id: params.id },
    });

    if (!existingDeliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    // Check if code already exists (excluding current deliverable)
    if (validatedData.code !== existingDeliverable.code) {
      const codeExists = await prisma.deliverable.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'A deliverable with this code already exists' },
          { status: 400 }
        );
      }
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

    const deliverable = await prisma.deliverable.update({
      where: { id: params.id },
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

    return NextResponse.json(deliverable);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if deliverable exists
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: params.id },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      );
    }

    // Note: No usage checking needed for deliverables as they are leaf nodes
    // in the data structure (nothing references them)

    await prisma.deliverable.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Deliverable deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    );
  }
}