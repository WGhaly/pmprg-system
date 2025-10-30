import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/resources/capacity - Get capacity planning data
export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const team = request.nextUrl.searchParams.get('team');
    const skillId = request.nextUrl.searchParams.get('skillId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build where clause for resources
    const resourceWhere: any = {
      active: true,
    };

    if (team) {
      resourceWhere.homeTeam = { contains: team, mode: 'insensitive' };
    }

    if (skillId) {
      resourceWhere.resourceSkills = {
        some: {
          skillId: skillId
        }
      };
    }

    // Get resources with their skills
    const resources = await prisma.resource.findMany({
      where: resourceWhere,
      include: {
        resourceSkills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get all allocations in the date range
    const allocations = await prisma.allocation.findMany({
      where: {
        resourceId: { in: resources.map(r => r.id) },
        weekStartDate: {
          gte: start,
          lte: end,
        }
      },
      include: {
        projectBlock: {
          include: {
            project: true,
            block: true,
          }
        }
      }
    });

    // Calculate weekly capacity data
    const weeklyCapacity = [];
    const current = new Date(start);
    
    // Round down to the start of the week (Monday)
    current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
    
    while (current <= end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Calculate capacity for this week
      const weekAllocations = allocations.filter(allocation => 
        allocation.weekStartDate.getTime() === weekStart.getTime()
      );
      
      const totalCapacity = resources.reduce((sum, resource) => 
        sum + resource.capacityHoursPerWeek, 0
      );
      
      const totalAllocated = weekAllocations.reduce((sum, allocation) => 
        sum + allocation.allocatedHours, 0
      );
      
      const totalAvailable = Math.max(0, totalCapacity - totalAllocated);
      const utilizationPercentage = totalCapacity > 0 
        ? Math.round((totalAllocated / totalCapacity) * 100 * 100) / 100
        : 0;

      // Calculate per-team breakdown
      const teamBreakdown: { [key: string]: any } = {};
      
      resources.forEach(resource => {
        const teamName = resource.homeTeam;
        if (!teamBreakdown[teamName]) {
          teamBreakdown[teamName] = {
            teamName,
            capacity: 0,
            allocated: 0,
            available: 0,
            utilization: 0,
            resourceCount: 0,
          };
        }
        
        teamBreakdown[teamName].capacity += resource.capacityHoursPerWeek;
        teamBreakdown[teamName].resourceCount += 1;
        
        const resourceAllocations = weekAllocations.filter(alloc => 
          alloc.resourceId === resource.id
        );
        
        const resourceAllocated = resourceAllocations.reduce((sum, alloc) => 
          sum + alloc.allocatedHours, 0
        );
        
        teamBreakdown[teamName].allocated += resourceAllocated;
      });

      // Calculate team utilization
      Object.values(teamBreakdown).forEach((team: any) => {
        team.available = Math.max(0, team.capacity - team.allocated);
        team.utilization = team.capacity > 0 
          ? Math.round((team.allocated / team.capacity) * 100 * 100) / 100
          : 0;
      });

      weeklyCapacity.push({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        capacity: {
          total: totalCapacity,
          allocated: totalAllocated,
          available: totalAvailable,
          utilization: utilizationPercentage,
        },
        teams: Object.values(teamBreakdown),
        resourceCount: resources.length,
      });
      
      // Move to next week
      current.setDate(current.getDate() + 7);
    }

    // Calculate skill-based capacity if skillId is provided
    let skillCapacity = null;
    if (skillId) {
      const skillResources = resources.filter(resource => 
        resource.resourceSkills.some(rs => rs.skillId === skillId)
      );
      
      const skillAllocations = allocations.filter(allocation =>
        skillResources.some(resource => resource.id === allocation.resourceId)
      );
      
      const totalSkillCapacity = skillResources.reduce((sum, resource) => 
        sum + resource.capacityHoursPerWeek, 0
      ) * weeklyCapacity.length;
      
      const totalSkillAllocated = skillAllocations.reduce((sum, allocation) => 
        sum + allocation.allocatedHours, 0
      );
      
      const skillInfo = skillResources.length > 0 && skillResources[0].resourceSkills.length > 0
        ? skillResources[0].resourceSkills.find(rs => rs.skillId === skillId)?.skill
        : null;
      
      skillCapacity = {
        skill: skillInfo ? {
          id: skillInfo.id,
          code: skillInfo.code,
          name: skillInfo.name,
          category: skillInfo.category,
        } : null,
        resourceCount: skillResources.length,
        totalCapacity: totalSkillCapacity,
        totalAllocated: totalSkillAllocated,
        totalAvailable: Math.max(0, totalSkillCapacity - totalSkillAllocated),
        utilization: totalSkillCapacity > 0 
          ? Math.round((totalSkillAllocated / totalSkillCapacity) * 100 * 100) / 100
          : 0,
      };
    }

    // Calculate overall summary
    const totalWeeks = weeklyCapacity.length;
    const totalCapacityHours = weeklyCapacity.reduce((sum, week) => sum + week.capacity.total, 0);
    const totalAllocatedHours = weeklyCapacity.reduce((sum, week) => sum + week.capacity.allocated, 0);
    const totalAvailableHours = Math.max(0, totalCapacityHours - totalAllocatedHours);
    const averageUtilization = totalWeeks > 0 
      ? Math.round((weeklyCapacity.reduce((sum, week) => sum + week.capacity.utilization, 0) / totalWeeks) * 100) / 100
      : 0;

    // Get unique teams for summary
    const teams = [...new Set(resources.map(r => r.homeTeam))];
    
    const responseData = {
      dateRange: {
        startDate: start,
        endDate: end,
        totalWeeks,
      },
      filters: {
        team: team || null,
        skillId: skillId || null,
      },
      summary: {
        totalResources: resources.length,
        totalTeams: teams.length,
        totalCapacityHours,
        totalAllocatedHours,
        totalAvailableHours,
        averageUtilization,
        isOverallocated: totalAllocatedHours > totalCapacityHours,
      },
      skillCapacity,
      weeklyCapacity,
      teams: teams.map(teamName => {
        const teamResources = resources.filter(r => r.homeTeam === teamName);
        const teamCapacity = teamResources.reduce((sum, r) => sum + r.capacityHoursPerWeek, 0) * totalWeeks;
        const teamAllocations = allocations.filter(alloc => 
          teamResources.some(r => r.id === alloc.resourceId)
        );
        const teamAllocated = teamAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
        
        return {
          name: teamName,
          resourceCount: teamResources.length,
          totalCapacity: teamCapacity,
          totalAllocated: teamAllocated,
          totalAvailable: Math.max(0, teamCapacity - teamAllocated),
          utilization: teamCapacity > 0 
            ? Math.round((teamAllocated / teamCapacity) * 100 * 100) / 100
            : 0,
        };
      }),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching capacity planning data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity planning data' },
      { status: 500 }
    );
  }
}