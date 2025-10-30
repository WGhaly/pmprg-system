import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateSkillSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  description: z.string().max(500).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateSkillSchema.parse(body);

    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id: params.id },
    });

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code (excluding current skill)
    const duplicateCode = await prisma.skill.findFirst({
      where: {
        code: validatedData.code,
        id: { not: params.id },
      },
    });

    if (duplicateCode) {
      return NextResponse.json(
        { error: 'A skill with this code already exists' },
        { status: 400 }
      );
    }

    // Update the skill
    const updatedSkill = await prisma.skill.update({
      where: { id: params.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        category: validatedData.category,
        description: validatedData.description || null,
      },
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    
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
    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id: params.id },
    });

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // TODO: Add dependency checks here when we have projects or other entities that reference skills
    // For example:
    // const dependentProjects = await prisma.projectSkill.findFirst({
    //   where: { skillId: params.id },
    // });
    // 
    // if (dependentProjects) {
    //   return NextResponse.json(
    //     { error: 'Cannot delete skill: it is being used by one or more projects' },
    //     { status: 400 }
    //   );
    // }

    // Delete the skill
    await prisma.skill.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}