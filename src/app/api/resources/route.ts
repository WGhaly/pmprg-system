import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  employeeCode: z.string().min(1, 'Employee code is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  employmentType: z.enum(['FTE', 'Contractor', 'Intern', 'Consultant']),
  monthlyRate: z.number().positive('Monthly rate must be positive'),
  capacityHoursPerWeek: z.number().positive('Capacity hours per week must be positive'),
  availabilityCalendar: z.string().optional(),
  skills: z.array(z.object({
    skillId: z.string(),
    level: z.number().min(1).max(10),
  })).optional(),
});

const updateResourceSchema = createResourceSchema.partial();

// GET /api/resources - Retrieve all resources with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSkills = searchParams.get('includeSkills') === 'true';
    const team = searchParams.get('team');
    const employmentType = searchParams.get('employmentType');
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

    // Build where clause
    const where: any = {};
    if (activeOnly) {
      where.active = true;
    }
    if (team) {
      where.homeTeam = { contains: team, mode: 'insensitive' };
    }
    if (employmentType) {
      where.employmentType = employmentType;
    }

    const resources = await prisma.resource.findMany({
      where,
      include: includeSkills ? { 
        resourceSkills: {
          include: {
            skill: true
          }
        } 
      } : { resourceSkills: false },
      orderBy: { name: 'asc' },
    });

    // Calculate derived fields and format response
    const resourcesWithMetrics = resources.map(resource => {
      const hourlyRate = resource.monthlyRate / (resource.capacityHoursPerWeek * 52 / 12);
      
      return {
        id: resource.id,
        name: resource.name,
        employeeCode: resource.employeeCode,
        homeTeam: resource.homeTeam,
        employmentType: resource.employmentType,
        monthlyRate: resource.monthlyRate,
        capacityHoursPerWeek: resource.capacityHoursPerWeek,
        availabilityCalendar: resource.availabilityCalendar,
        active: resource.active,
        derivedMetrics: {
          hourlyRate: Math.round(hourlyRate * 100) / 100,
          weeklyCapacity: resource.capacityHoursPerWeek,
          annualCapacity: resource.capacityHoursPerWeek * 52,
        },
        skills: includeSkills && 'resourceSkills' in resource && resource.resourceSkills ? 
          resource.resourceSkills.map((rs: any) => ({
            skillId: rs.skillId,
            skillCode: rs.skill?.code || '',
            skillName: rs.skill?.name || '',
            skillCategory: rs.skill?.category || '',
            level: rs.level,
          })) : undefined,
      };
    });

    return NextResponse.json(resourcesWithMetrics);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validationResult = createResourceSchema.safeParse(body);
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

    const data = validationResult.data;

    // Create resource in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the resource
      const newResource = await tx.resource.create({
        data: {
          name: data.name,
          employeeCode: data.employeeCode,
          homeTeam: data.homeTeam,
          employmentType: data.employmentType,
          monthlyRate: data.monthlyRate,
          capacityHoursPerWeek: data.capacityHoursPerWeek,
          availabilityCalendar: data.availabilityCalendar,
          active: true,
        },
      });

      // Add skills if provided
      if (data.skills && data.skills.length > 0) {
        await tx.resourceSkill.createMany({
          data: data.skills.map(skill => ({
            resourceId: newResource.id,
            skillId: skill.skillId,
            level: skill.level,
          })),
        });
      }

      // Return the resource with skills included
      return await tx.resource.findUnique({
        where: { id: newResource.id },
        include: {
          resourceSkills: {
            include: {
              skill: true
            }
          }
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create resource');
    }

    // Calculate derived metrics
    const hourlyRate = result.monthlyRate / (result.capacityHoursPerWeek * 52 / 12);

    const responseData = {
      id: result.id,
      name: result.name,
      employeeCode: result.employeeCode,
      homeTeam: result.homeTeam,
      employmentType: result.employmentType,
      monthlyRate: result.monthlyRate,
      capacityHoursPerWeek: result.capacityHoursPerWeek,
      availabilityCalendar: result.availabilityCalendar,
      active: result.active,
      derivedMetrics: {
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        weeklyCapacity: result.capacityHoursPerWeek,
        annualCapacity: result.capacityHoursPerWeek * 52,
      },
      skills: result.resourceSkills.map((rs: any) => ({
        skillId: rs.skillId,
        skillCode: rs.skill?.code || '',
        skillName: rs.skill?.name || '',
        skillCategory: rs.skill?.category || '',
        level: rs.level,
      })),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id] - Update a resource
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Validate the input
    const validationResult = updateResourceSchema.safeParse(updateData);
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

    const data = validationResult.data;

    // Update resource in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the resource
      const updatedResource = await tx.resource.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.employeeCode && { employeeCode: data.employeeCode }),
          ...(data.homeTeam && { homeTeam: data.homeTeam }),
          ...(data.employmentType && { employmentType: data.employmentType }),
          ...(data.monthlyRate && { monthlyRate: data.monthlyRate }),
          ...(data.capacityHoursPerWeek && { capacityHoursPerWeek: data.capacityHoursPerWeek }),
          ...(data.availabilityCalendar !== undefined && { availabilityCalendar: data.availabilityCalendar }),
        },
      });

      // Update skills if provided
      if (data.skills) {
        // Remove existing skills
        await tx.resourceSkill.deleteMany({
          where: { resourceId: id }
        });

        // Add new skills
        if (data.skills.length > 0) {
          await tx.resourceSkill.createMany({
            data: data.skills.map(skill => ({
              resourceId: id,
              skillId: skill.skillId,
              level: skill.level,
            })),
          });
        }
      }

      // Return the updated resource with skills
      return await tx.resource.findUnique({
        where: { id },
        include: {
          resourceSkills: {
            include: {
              skill: true
            }
          }
        },
      });
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Calculate derived metrics
    const hourlyRate = result.monthlyRate / (result.capacityHoursPerWeek * 52 / 12);

    const responseData = {
      id: result.id,
      name: result.name,
      employeeCode: result.employeeCode,
      homeTeam: result.homeTeam,
      employmentType: result.employmentType,
      monthlyRate: result.monthlyRate,
      capacityHoursPerWeek: result.capacityHoursPerWeek,
      availabilityCalendar: result.availabilityCalendar,
      active: result.active,
      derivedMetrics: {
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        weeklyCapacity: result.capacityHoursPerWeek,
        annualCapacity: result.capacityHoursPerWeek * 52,
      },
      skills: result.resourceSkills.map((rs: any) => ({
        skillId: rs.skillId,
        skillCode: rs.skill?.code || '',
        skillName: rs.skill?.name || '',
        skillCategory: rs.skill?.category || '',
        level: rs.level,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - Soft delete a resource
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Soft delete the resource (set active to false)
    const result = await prisma.resource.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      message: 'Resource deactivated successfully',
      resourceId: result.id,
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}