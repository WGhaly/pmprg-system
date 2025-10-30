import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/master-data/tiers/[id]/blocks - Get blocks for a specific tier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tierId = params.id;

    // Validate that the tier exists
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

    // Get all blocks for this tier with their configurations
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

    // Transform the data to include calculated durations and skills
    const blocksWithConfig = tierBlocks.map((tierBlock) => {
      const duration = tierBlock.overrideDurationWeeks || tierBlock.block.defaultDurationWeeks;
      const skillsMix = tierBlock.overrideSkillsMix 
        ? JSON.parse(tierBlock.overrideSkillsMix)
        : tierBlock.block.defaultSkillsMix 
          ? JSON.parse(tierBlock.block.defaultSkillsMix)
          : null;
      
      const dependencies = tierBlock.block.defaultDependencies
        ? JSON.parse(tierBlock.block.defaultDependencies)
        : [];

      return {
        id: tierBlock.id,
        sequenceIndex: tierBlock.sequenceIndex,
        block: {
          id: tierBlock.block.id,
          code: tierBlock.block.code,
          name: tierBlock.block.name,
          description: tierBlock.block.description,
          deliverables: tierBlock.block.deliverables,
        },
        durationWeeks: duration,
        skillsMix,
        dependencies,
        isOverride: {
          duration: tierBlock.overrideDurationWeeks !== null,
          skillsMix: tierBlock.overrideSkillsMix !== null,
        },
      };
    });

    return NextResponse.json({
      tier: {
        id: tier.id,
        code: tier.code,
        name: tier.name,
        description: tier.description,
        sizeHint: tier.sizeHint,
        projectType: tier.projectType,
      },
      blocks: blocksWithConfig,
      totalBlocks: blocksWithConfig.length,
      totalDurationWeeks: blocksWithConfig.reduce((sum, block) => sum + block.durationWeeks, 0),
    });
  } catch (error) {
    console.error('Error fetching tier blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier blocks' },
      { status: 500 }
    );
  }
}