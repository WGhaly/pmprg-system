// Master Data Type Definitions for PMPRG

export interface ProjectType {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectTypeInput {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateProjectTypeInput {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

export interface Tier {
  id: string;
  code: string;
  name: string;
  description?: string;
  sizeHint?: string;
  projectTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  projectType?: ProjectType;
}

export interface CreateTierInput {
  code: string;
  name: string;
  description?: string;
  sizeHint?: string;
  projectTypeId: string;
}

export interface UpdateTierInput {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  sizeHint?: string;
  projectTypeId?: string;
}

export interface Block {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultDurationWeeks: number;
  defaultDependencies?: Record<string, any>;
  defaultSkillsMix?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlockInput {
  code: string;
  name: string;
  description?: string;
  defaultDurationWeeks: number;
  defaultDependencies?: Record<string, any>;
  defaultSkillsMix?: Record<string, number>;
}

export interface UpdateBlockInput {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  defaultDurationWeeks?: number;
  defaultDependencies?: Record<string, any>;
  defaultSkillsMix?: Record<string, number>;
}

export interface TierBlock {
  id: string;
  tierId: string;
  blockId: string;
  overrideDurationWeeks?: number;
  overrideSkillsMix?: Record<string, number>;
  sequenceIndex: number;
  createdAt: Date;
  updatedAt: Date;
  tier?: Tier;
  block?: Block;
}

export interface CreateTierBlockInput {
  tierId: string;
  blockId: string;
  overrideDurationWeeks?: number;
  overrideSkillsMix?: Record<string, number>;
  sequenceIndex: number;
}

export interface Deliverable {
  id: string;
  code: string;
  name: string;
  description?: string;
  qualityCriteria?: Record<string, any>;
  acceptanceMetrics?: Record<string, any>;
  blockId: string;
  createdAt: Date;
  updatedAt: Date;
  block?: Block;
}

export interface CreateDeliverableInput {
  code: string;
  name: string;
  description?: string;
  qualityCriteria?: Record<string, any>;
  acceptanceMetrics?: Record<string, any>;
  blockId: string;
}

export interface UpdateDeliverableInput {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  qualityCriteria?: Record<string, any>;
  acceptanceMetrics?: Record<string, any>;
  blockId?: string;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSkillInput {
  code: string;
  name: string;
  description?: string;
  category: string;
}

export interface UpdateSkillInput {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
}

// Utility types
export type MasterDataEntity = 'projectType' | 'tier' | 'block' | 'deliverable' | 'skill';

export interface MasterDataValidationError {
  field: string;
  message: string;
}

export interface MasterDataApiResponse<T> {
  data?: T;
  error?: string;
  validationErrors?: MasterDataValidationError[];
}