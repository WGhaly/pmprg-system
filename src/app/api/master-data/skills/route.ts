import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSkillSchema } from '@/lib/validations/master-data';

// GET /api/master-data/skills - List all skills
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST /api/master-data/skills - Create a new skill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createSkillSchema.safeParse(body);
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

    const { code, name, description, category } = validationResult.data;

    // Check if code already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { code },
    });

    if (existingSkill) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: [
            {
              field: 'code',
              message: 'A skill with this code already exists',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create the skill
    const skill = await prisma.skill.create({
      data: {
        code,
        name,
        description,
        category,
      },
    });

    return NextResponse.json(
      skill,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}