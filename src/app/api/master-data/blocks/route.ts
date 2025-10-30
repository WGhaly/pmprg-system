import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createBlockSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultDurationWeeks: z.number().min(1),
  defaultDependencies: z.string().optional(),
  defaultSkillsMix: z.string().optional(),
});

export async function GET() {
  try {
    const blocks = await prisma.block.findMany({
      orderBy: [
        { code: 'asc' },
      ],
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

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createBlockSchema.parse(body);

    // Check for duplicate code
    const existingBlock = await prisma.block.findFirst({
      where: { code: validatedData.code },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: 'A block with this code already exists' },
        { status: 400 }
      );
    }

    // Create the block
    const block = await prisma.block.create({
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

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Error creating block:', error);
    
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