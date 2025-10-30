export interface ProjectBlockPlan {
  blockId: string;
  blockCode: string;
  blockName: string;
  sequenceIndex: number;
  plannedStart: Date;
  plannedEnd: Date;
  plannedDurationWeeks: number;
  dependencies: string[];
  requiredSkillsMix: any;
  deliverables: Array<{
    id: string;
    code: string;
    name: string;
    description?: string | null;
  }>;
}

export interface ProjectPlan {
  projectBlocks: ProjectBlockPlan[];
  projectStart: Date;
  projectEnd: Date;
  totalDurationWeeks: number;
  totalBlocks: number;
}

export interface TierBlock {
  id: string;
  sequenceIndex: number;
  block: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    deliverables: Array<{
      id: string;
      code: string;
      name: string;
      description?: string | null;
    }>;
  };
  durationWeeks: number;
  skillsMix: any;
  dependencies: string[];
}

/**
 * Auto-planning utility to generate project structure from tier blocks
 */
export class AutoPlanningEngine {
  /**
   * Generate a project plan from tier blocks
   */
  static generateProjectPlan(
    tierBlocks: TierBlock[],
    targetStartDate: Date,
    mode: 'strict_start' | 'priority_fit'
  ): ProjectPlan {
    // Sort blocks by sequence index
    const sortedBlocks = [...tierBlocks].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    
    const projectBlocks: ProjectBlockPlan[] = [];
    let currentDate = new Date(targetStartDate);
    
    // For strict_start mode, start immediately on target date
    // For priority_fit mode, we could implement logic to find optimal start time
    // For now, both modes start on target date but priority_fit could be enhanced later
    
    for (let i = 0; i < sortedBlocks.length; i++) {
      const tierBlock = sortedBlocks[i];
      const block = tierBlock.block;
      
      // Calculate start date considering dependencies
      let blockStartDate = new Date(currentDate);
      
      // Handle dependencies - for now, assume sequential execution
      // In the future, this could be enhanced to handle parallel execution
      if (i > 0) {
        // Start after the previous block ends
        blockStartDate = new Date(currentDate);
      }
      
      // Calculate end date (duration in weeks)
      const blockEndDate = this.addWeeks(blockStartDate, tierBlock.durationWeeks);
      
      const projectBlock: ProjectBlockPlan = {
        blockId: block.id,
        blockCode: block.code,
        blockName: block.name,
        sequenceIndex: tierBlock.sequenceIndex,
        plannedStart: blockStartDate,
        plannedEnd: blockEndDate,
        plannedDurationWeeks: tierBlock.durationWeeks,
        dependencies: tierBlock.dependencies,
        requiredSkillsMix: tierBlock.skillsMix,
        deliverables: block.deliverables,
      };
      
      projectBlocks.push(projectBlock);
      
      // Update current date for next block
      currentDate = new Date(blockEndDate);
    }
    
    const totalDurationWeeks = sortedBlocks.reduce((sum, block) => sum + block.durationWeeks, 0);
    
    return {
      projectBlocks,
      projectStart: new Date(targetStartDate),
      projectEnd: projectBlocks.length > 0 
        ? new Date(projectBlocks[projectBlocks.length - 1].plannedEnd)
        : new Date(targetStartDate),
      totalDurationWeeks,
      totalBlocks: projectBlocks.length,
    };
  }
  
  /**
   * Add weeks to a date, accounting for weekends
   */
  private static addWeeks(date: Date, weeks: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + (weeks * 7));
    return result;
  }
  
  /**
   * Add business days to a date, skipping weekends
   */
  private static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return result;
  }
  
  /**
   * Validate project plan for conflicts and constraints
   */
  static validateProjectPlan(plan: ProjectPlan): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check for overlapping blocks (if parallel execution is implemented)
    // Check for missing dependencies
    // Check for unrealistic durations
    
    // Basic validation: ensure all blocks have valid dates
    for (const block of plan.projectBlocks) {
      if (block.plannedStart >= block.plannedEnd) {
        errors.push(`Block ${block.blockCode}: Start date must be before end date`);
      }
      
      if (block.plannedDurationWeeks <= 0) {
        errors.push(`Block ${block.blockCode}: Duration must be positive`);
      }
    }
    
    // Check for gaps in sequence
    const sequences = plan.projectBlocks.map(b => b.sequenceIndex).sort((a, b) => a - b);
    for (let i = 1; i < sequences.length; i++) {
      if (sequences[i] !== sequences[i-1] + 1) {
        warnings.push(`Sequence gap detected between index ${sequences[i-1]} and ${sequences[i]}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }
  
  /**
   * Format date for display
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  /**
   * Calculate project summary statistics
   */
  static calculateProjectSummary(plan: ProjectPlan) {
    return {
      totalDurationWeeks: plan.totalDurationWeeks,
      totalBlocks: plan.totalBlocks,
      estimatedStartDate: this.formatDate(plan.projectStart),
      estimatedEndDate: this.formatDate(plan.projectEnd),
      blocksWithDeliverables: plan.projectBlocks.filter(b => b.deliverables.length > 0).length,
      totalDeliverables: plan.projectBlocks.reduce((sum, b) => sum + b.deliverables.length, 0),
    };
  }
}