import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateTierSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  projectTypeId: z.string().min(1),
  sizeHint: z.string().max(200).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateTierSchema.parse(body);

    // Check if tier exists
    const existingTier = await prisma.tier.findUnique({
      where: { id: params.id },
    });

    if (!existingTier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Check if project type exists
    const projectType = await prisma.projectType.findUnique({
      where: { id: validatedData.projectTypeId },
    });

    if (!projectType) {
      return NextResponse.json(
        { error: 'Project type not found' },
        { status: 400 }
      );
    }

    // Check for duplicate code within the same project type (excluding current tier)
    const duplicateCode = await prisma.tier.findFirst({
      where: {
        code: validatedData.code,
        projectTypeId: validatedData.projectTypeId,
        id: { not: params.id },
      },
    });

    if (duplicateCode) {
      return NextResponse.json(
        { error: 'A tier with this code already exists for this project type' },
        { status: 400 }
      );
    }

    // Update the tier
    const updatedTier = await prisma.tier.update({
      where: { id: params.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        projectTypeId: validatedData.projectTypeId,
        sizeHint: validatedData.sizeHint || null,
      },
      include: {
        projectType: true,
      },
    });

    return NextResponse.json(updatedTier);
  } catch (error) {
    console.error('Error updating tier:', error);
    
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
    // Check if tier exists
    const existingTier = await prisma.tier.findUnique({
      where: { id: params.id },
    });

    if (!existingTier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // TODO: Add dependency checks here when we have projects or other entities that reference tiers
    // For example:
    // const dependentProjects = await prisma.project.findFirst({
    //   where: { tierId: params.id },
    // });
    // 
    // if (dependentProjects) {
    //   return NextResponse.json(
    //     { error: 'Cannot delete tier: it is being used by one or more projects' },
    //     { status: 400 }
    //   );
    // }

    // Delete the tier
    await prisma.tier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting tier:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}