import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AutoPlanningEngine } from '@/lib/auto-planning';
import { z } from 'zod';

// Validation schema for project preview
const previewProjectSchema = z.object({
  projectTypeId: z.string().min(1, 'Project type is required'),
  tierId: z.string().min(1, 'Tier is required'),
  targetStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  mode: z.enum(['strict_start', 'priority_fit']),
});

// POST /api/projects/preview - Preview auto-planned project structure without saving
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = previewProjectSchema.safeParse(body);
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

    const {
      projectTypeId,
      tierId,
      targetStartDate,
      mode,
    } = validationResult.data;

    // Validate that the project type and tier exist and are compatible
    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
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

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    if (tier.projectTypeId !== projectTypeId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: [
            {
              field: 'tierId',
              message: 'Selected tier does not belong to the selected project type',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Get tier blocks for auto-planning
    const tierBlocks = await prisma.tierBlock.findMany({
      where: { tierId },
      orderBy: { sequenceIndex: 'asc' },
      include: {
        block: {
          include: {
            deliverables: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Check if tier has blocks
    if (tierBlocks.length === 0) {
      return NextResponse.json(
        {
          error: 'No blocks configured for this tier',
          message: 'The selected tier does not have any blocks configured. Please contact an administrator to set up blocks for this tier.',
        },
        { status: 400 }
      );
    }

    // Transform tier blocks for auto-planning
    const blocksForPlanning = tierBlocks.map((tierBlock) => ({
      id: tierBlock.id,
      sequenceIndex: tierBlock.sequenceIndex,
      block: tierBlock.block,
      durationWeeks: tierBlock.overrideDurationWeeks || tierBlock.block.defaultDurationWeeks,
      skillsMix: tierBlock.overrideSkillsMix 
        ? JSON.parse(tierBlock.overrideSkillsMix)
        : tierBlock.block.defaultSkillsMix 
          ? JSON.parse(tierBlock.block.defaultSkillsMix)
          : null,
      dependencies: tierBlock.block.defaultDependencies
        ? JSON.parse(tierBlock.block.defaultDependencies)
        : [],
    }));

    // Generate project plan using auto-planning engine
    const projectPlan = AutoPlanningEngine.generateProjectPlan(
      blocksForPlanning,
      new Date(targetStartDate),
      mode
    );

    // Validate the generated plan
    const validation = AutoPlanningEngine.validateProjectPlan(projectPlan);

    // Calculate planning summary
    const planningSummary = AutoPlanningEngine.calculateProjectSummary(projectPlan);

    // Return the preview without creating anything in the database
    return NextResponse.json({
      isValid: validation.isValid,
      tier: {
        id: tier.id,
        code: tier.code,
        name: tier.name,
        description: tier.description,
        sizeHint: tier.sizeHint,
        projectType: tier.projectType,
      },
      projectPlan: {
        blocks: projectPlan.projectBlocks.map(block => ({
          blockCode: block.blockCode,
          blockName: block.blockName,
          sequenceIndex: block.sequenceIndex,
          plannedStart: block.plannedStart.toISOString(),
          plannedEnd: block.plannedEnd.toISOString(),
          plannedDurationWeeks: block.plannedDurationWeeks,
          dependencies: block.dependencies,
          deliverables: block.deliverables,
          skillsMix: block.requiredSkillsMix,
        })),
        projectStart: projectPlan.projectStart.toISOString(),
        projectEnd: projectPlan.projectEnd.toISOString(),
        totalDurationWeeks: projectPlan.totalDurationWeeks,
        totalBlocks: projectPlan.totalBlocks,
      },
      planningSummary,
      validation: {
        isValid: validation.isValid,
        warnings: validation.warnings,
        errors: validation.errors,
      },
      metadata: {
        mode,
        targetStartDate,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating project preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate project preview' },
      { status: 500 }
    );
  }
}