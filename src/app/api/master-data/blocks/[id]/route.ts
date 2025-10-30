import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateBlockSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultDurationWeeks: z.number().min(1),
  defaultDependencies: z.string().optional(),
  defaultSkillsMix: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateBlockSchema.parse(body);

    // Check if block exists
    const existingBlock = await prisma.block.findUnique({
      where: { id: params.id },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code (excluding current block)
    const duplicateCode = await prisma.block.findFirst({
      where: {
        code: validatedData.code,
        id: { not: params.id },
      },
    });

    if (duplicateCode) {
      return NextResponse.json(
        { error: 'A block with this code already exists' },
        { status: 400 }
      );
    }

    // Update the block
    const updatedBlock = await prisma.block.update({
      where: { id: params.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        defaultDurationWeeks: validatedData.defaultDurationWeeks,
        defaultDependencies: validatedData.defaultDependencies || null,
        defaultSkillsMix: validatedData.defaultSkillsMix || null,
      },
      include: {
        deliverables: true,
        _count: {
          select: {
            tierBlocks: true,
            projectBlocks: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error('Error updating block:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if block exists
    const existingBlock = await prisma.block.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tierBlocks: true,
            projectBlocks: true,
            deliverables: true,
          },
        },
      },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    // Check for dependencies
    const hasUsage = existingBlock._count.tierBlocks > 0 || existingBlock._count.projectBlocks > 0;
    
    if (hasUsage) {
      return NextResponse.json(
        { error: 'Cannot delete block: it is being used by one or more tiers or projects' },
        { status: 400 }
      );
    }

    // If there are deliverables, we need to delete them first
    if (existingBlock._count.deliverables > 0) {
      await prisma.deliverable.deleteMany({
        where: { blockId: params.id },
      });
    }

    // Delete the block
    await prisma.block.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Block deleted successfully' });
  } catch (error) {
    console.error('Error deleting block:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}