import { z } from 'zod';

export const createProjectWizardSchema = z.object({
  // Step 1: Basic Information
  code: z.string().min(1, 'Project code is required').max(50, 'Project code too long'),
  name: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  clientType: z.string().optional(),
  notes: z.string().optional(),
  
  // Step 2: Project Type and Tier
  projectTypeId: z.string().min(1, 'Project type is required'),
  tierId: z.string().min(1, 'Tier is required'),
  
  // Step 3: Scheduling Configuration
  priority: z.number().int().min(1).max(10).default(1),
  targetStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  mode: z.enum(['strict_start', 'priority_fit']),
  
  // Step 4: Resource Allocation
  resourceAllocations: z.record(z.string(), z.record(z.string(), z.number().min(0).max(100))).optional(),
  
  // Step 5: Budget (optional)
  budgetCapex: z.number().optional(),
  budgetOpex: z.number().optional(),
});

export type CreateProjectWizardInput = z.infer<typeof createProjectWizardSchema>;

// Step-specific schemas for validation
export const basicInfoSchema = createProjectWizardSchema.pick({
  code: true,
  name: true,
  clientType: true,
  notes: true,
});

export const projectTypeSchema = createProjectWizardSchema.pick({
  projectTypeId: true,
  tierId: true,
});

export const schedulingSchema = createProjectWizardSchema.pick({
  priority: true,
  targetStartDate: true,
  mode: true,
});

export const resourceAllocationSchema = createProjectWizardSchema.pick({
  resourceAllocations: true,
});

export const budgetSchema = createProjectWizardSchema.pick({
  budgetCapex: true,
  budgetOpex: true,
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type ProjectTypeInput = z.infer<typeof projectTypeSchema>;
export type SchedulingInput = z.infer<typeof schedulingSchema>;
export type ResourceAllocationInput = z.infer<typeof resourceAllocationSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;