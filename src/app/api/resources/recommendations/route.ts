import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define types for resources with relationships
interface ResourceSkill {
  level: number;
  skill: {
    name: string;
  };
}

interface ResourceWithSkills {
  id: string;
  name: string;
  email: string;
  role: string;
  homeTeam: string;
  hourlyRate: number;
  active: boolean;
  resourceSkills: ResourceSkill[];
}

// Define types for recommendation response
interface SkillAnalysis {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  skillBreakdown: Array<{ 
    skill: string; 
    level: number; 
    required: boolean; 
  }>;
}

interface AvailabilityData {
  capacity: number;
  conflicts: Array<{
    type: string;
    period: string;
    severity: string;
  }>;
  riskFactors: {
    overallocation: number;
    vacation: number;
    otherProjects: number;
  };
}

interface ResourceRecommendation {
  resource: {
    id: string;
    name: string;
    email: string;
    role: string;
    homeTeam: string;
    hourlyRate: number;
  };
  skillAnalysis: SkillAnalysis;
  capacityFit: number;
  experienceBonus: number;
  teamSynergy: number;
  overallScore: number;
  availability: AvailabilityData;
  recommendedAllocation: Record<string, number>;
  confidence: number;
  reasoning: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectRequirements, timeframe, preferences = {} } = body;

    // Validate input
    if (!projectRequirements || !Array.isArray(projectRequirements)) {
      return NextResponse.json(
        { error: 'Invalid project requirements provided' },
        { status: 400 }
      );
    }

    if (!timeframe || !timeframe.startDate || !timeframe.endDate) {
      return NextResponse.json(
        { error: 'Invalid timeframe provided' },
        { status: 400 }
      );
    }

    const recommendations = await generateIntelligentRecommendations(
      projectRequirements,
      timeframe,
      preferences
    );

    return NextResponse.json({
      recommendations,
      metadata: {
        algorithmVersion: '1.0',
        generatedAt: new Date().toISOString(),
        timeframe,
      },
    });
  } catch (error) {
    console.error('Error generating resource recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

interface ProjectRequirement {
  blockId: string;
  blockName: string;
  blockCode: string;
  duration: number;
  requiredSkills: Array<{
    skillId: string;
    skillName: string;
    category: string;
    minimumLevel: number;
    importance: number; // 1-10, 10 being critical
  }>;
  complexity: number; // 1-10
  priority: number; // 1-10
  estimatedEffort: number; // hours
}

interface Timeframe {
  startDate: string;
  endDate: string;
}

interface Preferences {
  preferredTeams?: string[];
  excludeResources?: string[];
  maxUtilization?: number; // 0-100
  prioritizeExperience?: boolean;
  allowCrossTeamAssignment?: boolean;
}

async function generateIntelligentRecommendations(
  requirements: ProjectRequirement[],
  timeframe: Timeframe,
  preferences: Preferences
) {
  // Load all available resources with their skills and current allocations
  const resources = await prisma.resource.findMany({
    where: {
      active: true,
      ...(preferences.excludeResources && preferences.excludeResources.length > 0 && {
        id: {
          notIn: preferences.excludeResources,
        },
      }),
      ...(preferences.preferredTeams && preferences.preferredTeams.length > 0 && {
        homeTeam: {
          in: preferences.preferredTeams,
        },
      }),
    },
    include: {
      resourceSkills: {
        include: {
          skill: true,
        },
      },
    },
  });

  // Load current allocations for capacity calculation
  const currentAllocations = await prisma.allocation.findMany({
    where: {
      weekStartDate: {
        gte: new Date(timeframe.startDate),
        lte: new Date(timeframe.endDate),
      },
    },
    include: {
      resource: true,
      projectBlock: {
        include: {
          project: true,
        },
      },
    },
  });

  // Calculate availability for each resource
  const resourceAvailability = await calculateResourceAvailability(
    resources,
    currentAllocations,
    timeframe
  );

  // Generate recommendations for each requirement
  const recommendations = [];

  for (const requirement of requirements) {
    const blockRecommendations = await generateBlockRecommendations(
      requirement,
      resources,
      resourceAvailability,
      preferences
    );

    recommendations.push({
      blockId: requirement.blockId,
      blockName: requirement.blockName,
      blockCode: requirement.blockCode,
      requirement,
      recommendations: blockRecommendations,
      recommendedTeam: await getRecommendedTeamComposition(
        requirement,
        blockRecommendations
      ),
    });
  }

  // Apply global optimization
  const optimizedRecommendations = await optimizeGlobalAllocation(
    recommendations,
    preferences
  );

  return optimizedRecommendations;
}

async function calculateResourceAvailability(
  resources: any[],
  currentAllocations: any[],
  timeframe: Timeframe
) {
  const availability = new Map();

  for (const resource of resources) {
    // Calculate total capacity for the timeframe
    const startDate = new Date(timeframe.startDate);
    const endDate = new Date(timeframe.endDate);
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalCapacityHours = resource.capacityHoursPerWeek * totalWeeks;

    // Calculate current allocations
    const resourceAllocations = currentAllocations.filter(
      alloc => alloc.resourceId === resource.id
    );
    const totalAllocatedHours = resourceAllocations.reduce(
      (sum, alloc) => sum + alloc.hoursAllocated,
      0
    );

    // Calculate availability metrics
    const availableHours = totalCapacityHours - totalAllocatedHours;
    const utilizationPercentage = (totalAllocatedHours / totalCapacityHours) * 100;
    const isOverallocated = utilizationPercentage > 100;
    const hasCapacity = availableHours > 0;

    // Calculate risk factors
    const riskFactors = {
      overallocation: isOverallocated ? 10 : 0,
      highUtilization: utilizationPercentage > 90 ? 5 : 0,
      projectConflicts: getProjectConflictScore(resourceAllocations),
      skillMismatch: 0, // Will be calculated per requirement
    };

    availability.set(resource.id, {
      resource,
      totalCapacityHours,
      totalAllocatedHours,
      availableHours,
      utilizationPercentage,
      isOverallocated,
      hasCapacity,
      riskFactors,
      currentProjects: resourceAllocations.map(alloc => ({
        projectName: alloc.projectBlock.project.name,
        blockName: alloc.projectBlock.name,
        hoursAllocated: alloc.hoursAllocated,
        weekStartDate: alloc.weekStartDate,
      })),
    });
  }

  return availability;
}

function getProjectConflictScore(allocations: any[]): number {
  // Calculate conflict score based on number of concurrent projects
  const uniqueProjects = new Set(allocations.map(alloc => alloc.projectBlock.projectId));
  if (uniqueProjects.size <= 1) return 0;
  if (uniqueProjects.size <= 2) return 2;
  if (uniqueProjects.size <= 3) return 5;
  return 10; // High conflict for 4+ concurrent projects
}

async function generateBlockRecommendations(
  requirement: ProjectRequirement,
  resources: any[],
  resourceAvailability: Map<string, any>,
  preferences: Preferences
) {
  const blockRecommendations = [];

  for (const resource of resources) {
    const availability = resourceAvailability.get(resource.id);
    if (!availability) continue;

    // Calculate skill match score
    const skillAnalysis = calculateSkillMatch(resource, requirement.requiredSkills.map((s: any) => s.skillName || s));
    
    // Calculate capacity fit score
    const capacityAnalysis = calculateCapacityFit(
      requirement.estimatedEffort,
      availability,
      preferences.maxUtilization || 85
    );

    // Calculate experience bonus
    const experienceBonus = calculateExperienceBonus(
      resource,
      requirement,
      preferences.prioritizeExperience || false
    );

    // Calculate team synergy score
    const teamSynergyScore = calculateTeamSynergyScore(resource, requirement);

    // Calculate availability score
    const availabilityScore = calculateAvailabilityScore(availability, requirement);

    // Calculate overall recommendation score
    const overallScore = Math.round(
      (skillAnalysis.score * 0.35) +
      (capacityAnalysis.score * 0.25) +
      (experienceBonus * 0.15) +
      (teamSynergyScore * 0.10) +
      (availabilityScore * 0.15)
    );

    // Calculate recommended allocation percentage
    const recommendedAllocation = calculateOptimalAllocation(
      requirement.estimatedEffort,
      availability.availableHours,
      resource.capacityHoursPerWeek
    );

    blockRecommendations.push({
      resourceId: resource.id,
      resourceName: resource.name,
      employeeCode: resource.employeeCode,
      homeTeam: resource.homeTeam,
      overallScore,
      recommendedAllocation,
      confidence: calculateConfidenceScore(skillAnalysis, capacityAnalysis, availability),
      analysis: {
        skillMatch: skillAnalysis,
        capacityFit: capacityAnalysis,
        experienceBonus,
        teamSynergy: teamSynergyScore,
        availability: availabilityScore,
        riskFactors: availability.riskFactors,
      },
      reasoning: generateRecommendationReasoning(
        skillAnalysis,
        capacityAnalysis,
        experienceBonus,
        availability
      ),
    });
  }

  // Sort by overall score and confidence
  return blockRecommendations
    .sort((a, b) => {
      const scoreA = a.overallScore + a.confidence;
      const scoreB = b.overallScore + b.confidence;
      return scoreB - scoreA;
    })
    .slice(0, 10); // Return top 10 recommendations
}

  function calculateSkillMatch(resource: ResourceWithSkills, requiredSkills: string[]): {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    skillBreakdown: Array<{ skill: string; level: number; required: boolean }>;
  } {
    const resourceSkillMap = new Map(
      resource.resourceSkills.map(rs => [rs.skill.name, rs.level])
    );
    
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];
    const skillBreakdown: Array<{ skill: string; level: number; required: boolean }> = [];
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const skill of requiredSkills) {
      maxPossibleScore += 5; // Maximum skill level
      
      if (resourceSkillMap.has(skill)) {
        const level = resourceSkillMap.get(skill)!;
        matchingSkills.push(skill);
        totalScore += level;
        skillBreakdown.push({ skill, level, required: true });
      } else {
        missingSkills.push(skill);
        skillBreakdown.push({ skill, level: 0, required: true });
      }
    }
    
    // Add bonus skills (not required but valuable)
    for (const [skillName, level] of resourceSkillMap) {
      if (!requiredSkills.includes(skillName)) {
        skillBreakdown.push({ skill: skillName, level, required: false });
      }
    }
    
    const score = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return {
      score,
      matchingSkills,
      missingSkills,
      skillBreakdown,
    };
  }

function calculateCapacityFit(
  estimatedEffort: number,
  availability: any,
  maxUtilization: number
) {
  const { availableHours, utilizationPercentage } = availability;
  
  // Check if effort can fit within available capacity
  const canFit = estimatedEffort <= availableHours;
  
  // Calculate utilization impact
  const newUtilization = utilizationPercentage + ((estimatedEffort / availability.totalCapacityHours) * 100);
  
  // Score based on fit and utilization impact
  let score = 0;
  if (canFit) {
    if (newUtilization <= maxUtilization * 0.7) score = 100; // Comfortable fit
    else if (newUtilization <= maxUtilization) score = 80; // Good fit
    else if (newUtilization <= maxUtilization * 1.1) score = 60; // Tight fit
    else score = 30; // Overcommitted
  } else {
    score = 10; // Cannot fit
  }

  return {
    score,
    canFit,
    availableHours,
    requiredHours: estimatedEffort,
    currentUtilization: utilizationPercentage,
    projectedUtilization: newUtilization,
    utilizationImpact: newUtilization - utilizationPercentage,
  };
}

function calculateExperienceBonus(
  resource: any,
  requirement: ProjectRequirement,
  prioritizeExperience: boolean
): number {
  if (!prioritizeExperience) return 50;

  // Calculate experience based on skill levels and employment type
  const averageSkillLevel = resource.skills.length > 0
    ? resource.skills.reduce((sum: number, skill: any) => sum + skill.level, 0) / resource.skills.length
    : 0;

  let experienceScore = Math.min(averageSkillLevel * 10, 50); // Base on average skill level

  // Bonus for senior employment types
  if (resource.employmentType === 'senior' || resource.employmentType === 'lead') {
    experienceScore += 30;
  } else if (resource.employmentType === 'mid-level') {
    experienceScore += 15;
  }

  // Bonus for complex projects
  if (requirement.complexity >= 8 && averageSkillLevel >= 4) {
    experienceScore += 20;
  }

  return Math.min(Math.round(experienceScore), 100);
}

function calculateTeamSynergyScore(resource: any, requirement: ProjectRequirement): number {
  // Base score for team compatibility
  let synergyScore = 50;

  // Bonus for specialized teams working on matching project types
  const teamSpecializations = {
    'Backend': ['api', 'database', 'server'],
    'Frontend': ['ui', 'react', 'javascript'],
    'DevOps': ['aws', 'docker', 'kubernetes'],
    'QA': ['testing', 'automation', 'quality'],
    'Data': ['analytics', 'python', 'sql'],
  };

  const requiredSkillNames = requirement.requiredSkills.map(s => s.skillName.toLowerCase());
  const resourceTeam = resource.homeTeam;

  if (teamSpecializations[resourceTeam as keyof typeof teamSpecializations]) {
    const specializations = teamSpecializations[resourceTeam as keyof typeof teamSpecializations];
    const hasMatchingSpecialization = specializations.some((spec: string) =>
      requiredSkillNames.some(skillName => skillName.includes(spec))
    );
    
    if (hasMatchingSpecialization) {
      synergyScore += 30;
    }
  }

  return Math.min(Math.round(synergyScore), 100);
}

function calculateAvailabilityScore(availability: any, requirement: ProjectRequirement): number {
  let score = 0;

  // Base availability score
  if (availability.hasCapacity) {
    score = 50;
  } else {
    return 10; // No capacity available
  }

  // Bonus for low utilization
  if (availability.utilizationPercentage <= 50) {
    score += 30;
  } else if (availability.utilizationPercentage <= 75) {
    score += 20;
  } else if (availability.utilizationPercentage <= 90) {
    score += 10;
  }

  // Penalty for project conflicts
  score -= availability.riskFactors.projectConflicts;

  // Bonus for priority projects
  if (requirement.priority >= 8) {
    score += 10;
  }

  return Math.max(Math.min(Math.round(score), 100), 0);
}

function calculateOptimalAllocation(
  estimatedEffort: number,
  availableHours: number,
  weeklyCapacity: number
): number {
  if (availableHours <= 0) return 0;

  // Calculate percentage based on effort and availability
  const idealPercentage = (estimatedEffort / availableHours) * 100;
  
  // Cap at reasonable limits
  return Math.min(Math.max(Math.round(idealPercentage), 10), 100);
}

function calculateConfidenceScore(
  skillAnalysis: any,
  capacityAnalysis: any,
  availability: any
): number {
  let confidence = 50;

  // High confidence for perfect skill matches
  if (skillAnalysis.coverage >= 100) confidence += 25;
  else if (skillAnalysis.coverage >= 80) confidence += 15;
  else if (skillAnalysis.coverage >= 60) confidence += 5;
  else confidence -= 10;

  // High confidence for good capacity fit
  if (capacityAnalysis.canFit && capacityAnalysis.projectedUtilization <= 80) {
    confidence += 20;
  } else if (capacityAnalysis.canFit) {
    confidence += 10;
  } else {
    confidence -= 15;
  }

  // Reduce confidence for high-risk allocations
  const totalRisk = Object.values(availability.riskFactors).reduce((a, b) => Number(a) + Number(b), 0) as number;
  confidence -= totalRisk;

  return Math.max(Math.min(Math.round(confidence), 100), 0);
}

function generateRecommendationReasoning(
  skillAnalysis: any,
  capacityAnalysis: any,
  experienceBonus: number,
  availability: any
): string[] {
  const reasons = [];

  // Skill-based reasoning
  if (skillAnalysis.coverage >= 100) {
    reasons.push(`Perfect skill match - covers all required skills`);
  } else if (skillAnalysis.coverage >= 80) {
    reasons.push(`Strong skill match - covers ${Math.round(skillAnalysis.coverage)}% of requirements`);
  } else if (skillAnalysis.coverage >= 50) {
    reasons.push(`Partial skill match - may need support for ${skillAnalysis.mismatches.length} skills`);
  } else {
    reasons.push(`Limited skill match - significant training may be required`);
  }

  // Capacity-based reasoning
  if (capacityAnalysis.canFit) {
    if (capacityAnalysis.projectedUtilization <= 70) {
      reasons.push(`Excellent capacity - comfortable workload`);
    } else if (capacityAnalysis.projectedUtilization <= 85) {
      reasons.push(`Good capacity - manageable workload`);
    } else {
      reasons.push(`Tight capacity - near maximum utilization`);
    }
  } else {
    reasons.push(`Insufficient capacity - would require overallocation`);
  }

  // Experience-based reasoning
  if (experienceBonus >= 80) {
    reasons.push(`Highly experienced resource - excellent for complex work`);
  } else if (experienceBonus >= 60) {
    reasons.push(`Experienced resource - good for standard complexity`);
  }

  // Risk-based reasoning
  const totalRisk = Object.values(availability.riskFactors).reduce((a, b) => Number(a) + Number(b), 0) as number;
  if (totalRisk > 15) {
    reasons.push(`High risk assignment - multiple project conflicts`);
  } else if (totalRisk > 5) {
    reasons.push(`Moderate risk - some scheduling conflicts possible`);
  } else {
    reasons.push(`Low risk assignment - clean availability`);
  }

  return reasons;
}

async function getRecommendedTeamComposition(
  requirement: ProjectRequirement,
  recommendations: any[]
): Promise<any> {
  if (recommendations.length === 0) return null;

  // Group by teams
  const teamGroups = recommendations.reduce((groups, rec) => {
    const team = rec.homeTeam;
    if (!groups[team]) groups[team] = [];
    groups[team].push(rec);
    return groups;
  }, {});

  // Find best team composition
  const teamCompositions = Object.entries(teamGroups).map(([teamName, members]: [string, any]) => {
    const avgScore = members.reduce((sum: number, m: any) => sum + m.overallScore, 0) / members.length;
    const totalConfidence = members.reduce((sum: number, m: any) => sum + m.confidence, 0) / members.length;
    const skillCoverage = calculateTeamSkillCoverage(requirement.requiredSkills, members);
    
    return {
      teamName,
      members,
      avgScore,
      totalConfidence,
      skillCoverage,
      compositionScore: avgScore + totalConfidence + skillCoverage,
    };
  });

  return teamCompositions.sort((a, b) => b.compositionScore - a.compositionScore)[0];
}

function calculateTeamSkillCoverage(requiredSkills: any[], teamMembers: any[]): number {
  if (requiredSkills.length === 0) return 100;
  
  const coveredSkills = new Set();
  
  for (const member of teamMembers) {
    for (const match of member.analysis.skillMatch.matches) {
      coveredSkills.add(match.skillName);
    }
  }
  
  return (coveredSkills.size / requiredSkills.length) * 100;
}

async function optimizeGlobalAllocation(
  recommendations: any[],
  preferences: Preferences
): Promise<any[]> {
  // Apply global optimization rules
  
  // 1. Prevent over-allocation of high-demand resources
  const resourceUsage = new Map();
  
  for (const blockRec of recommendations) {
    for (const rec of blockRec.recommendations) {
      const current = resourceUsage.get(rec.resourceId) || { blocks: 0, totalAllocation: 0 };
      current.blocks += 1;
      current.totalAllocation += rec.recommendedAllocation;
      resourceUsage.set(rec.resourceId, current);
    }
  }

  // 2. Adjust recommendations for over-utilized resources
  for (const blockRec of recommendations) {
    blockRec.recommendations = blockRec.recommendations.map((rec: any) => {
      const usage = resourceUsage.get(rec.resourceId);
      if (usage && usage.totalAllocation > 100) {
        // Reduce score for over-utilized resources
        rec.overallScore = Math.max(rec.overallScore - 20, 0);
        rec.reasoning.push('Resource appears over-allocated across multiple blocks');
      }
      return rec;
    });
    
    // Re-sort after adjustment
    blockRec.recommendations.sort((a: any, b: any) => b.overallScore - a.overallScore);
  }

  return recommendations;
}