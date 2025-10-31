import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AutoPlanningEngine } from '@/lib/auto-planning';
import { z } from 'zod';

// Validation schema for project creation
const createProjectSchema = z.object({
  code: z.string().min(1, 'Project code is required').max(50, 'Project code too long'),
  name: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  clientType: z.string().optional(),
  projectTypeId: z.string().min(1, 'Project type is required'),
  tierId: z.string().min(1, 'Tier is required'),
  priority: z.number().int().min(1).max(10).default(1),
  targetStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  mode: z.enum(['strict_start', 'priority_fit']),
  budgetCapex: z.number().optional(),
  budgetOpex: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/projects - List all projects (basic implementation)
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projectType: {
          select: { code: true, name: true },
        },
        tier: {
          select: { code: true, name: true },
        },
        projectBlocks: {
          include: {
            block: {
              select: { code: true, name: true },
            },
            allocations: {
              include: {
                resource: {
                  select: { id: true, name: true, employeeCode: true },
                },
              },
            },
          },
          orderBy: { sequenceIndex: 'asc' },
        },
        _count: {
          select: { projectBlocks: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project with auto-planning
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createProjectSchema.safeParse(body);
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
      code,
      name,
      clientType,
      projectTypeId,
      tierId,
      priority,
      targetStartDate,
      mode,
      budgetCapex,
      budgetOpex,
      notes,
    } = validationResult.data;

    // Check if project code already exists
    const existingProject = await prisma.project.findUnique({
      where: { code },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: [
            {
              field: 'code',
              message: 'A project with this code already exists',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate that the project type and tier exist and are compatible
    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
      include: {
        projectType: true,
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
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Auto-planning failed',
          planningErrors: validation.errors,
          planningWarnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Create project and project blocks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          code,
          name,
          clientType,
          projectTypeId,
          tierId,
          priority,
          targetStartDate: new Date(targetStartDate),
          mode,
          budgetCapex,
          budgetOpex,
          notes,
          status: 'planning',
        },
      });

      // Create project blocks
      const projectBlocks = await Promise.all(
        projectPlan.projectBlocks.map(async (planBlock, index) => {
          return tx.projectBlock.create({
            data: {
              projectId: project.id,
              blockId: planBlock.blockId,
              plannedStart: planBlock.plannedStart,
              plannedEnd: planBlock.plannedEnd,
              plannedDurationWeeks: planBlock.plannedDurationWeeks,
              sequenceIndex: planBlock.sequenceIndex,
              dependencies: JSON.stringify(planBlock.dependencies),
              requiredSkillsMix: planBlock.requiredSkillsMix 
                ? JSON.stringify(planBlock.requiredSkillsMix)
                : null,
              inhouseVsExternal: 'inhouse', // Default value
              status: 'not_started',
            },
          });
        })
      );

      return { project, projectBlocks };
    });

    // Return the created project with planning summary
    const planningSummary = AutoPlanningEngine.calculateProjectSummary(projectPlan);
    
    return NextResponse.json(
      {
        project: result.project,
        projectBlocks: result.projectBlocks,
        planningSummary,
        planningWarnings: validation.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}