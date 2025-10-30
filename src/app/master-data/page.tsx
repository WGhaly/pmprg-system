'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Settings, Search, Edit, Trash2, Home } from 'lucide-react';
import ProjectTypeForm from '@/components/master-data/ProjectTypeForm';
import EditProjectTypeForm from '@/components/master-data/EditProjectTypeForm';
import DeleteProjectTypeDialog from '@/components/master-data/DeleteProjectTypeDialog';
import CreateTierForm from './forms/CreateTierForm';
import EditTierForm from './forms/EditTierForm';
import DeleteTierDialog from './forms/DeleteTierDialog';
import CreateSkillForm from './forms/CreateSkillForm';
import EditSkillForm from './forms/EditSkillForm';
import DeleteSkillDialog from './forms/DeleteSkillDialog';
import CreateBlockForm from '@/app/master-data/forms/CreateBlockForm';
import EditBlockForm from '@/app/master-data/forms/EditBlockForm';
import DeleteBlockDialog from '@/app/master-data/forms/DeleteBlockDialog';
import CreateDeliverableForm from '@/components/master-data/CreateDeliverableForm';
import EditDeliverableForm from '@/components/master-data/EditDeliverableForm';
import DeleteDeliverableDialog from '@/components/master-data/DeleteDeliverableDialog';

interface ProjectType {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Tier {
  id: string;
  code: string;
  name: string;
  description?: string;
  sizeHint?: string;
  projectTypeId: string;
  projectType: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Skill {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Block {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultDurationWeeks: number;
  defaultDependencies?: string;
  defaultSkillsMix?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tierBlocks: number;
    projectBlocks: number;
    deliverables: number;
  };
}

interface Deliverable {
  id: string;
  code: string;
  name: string;
  description?: string;
  qualityCriteria?: string;
  acceptanceMetrics?: string;
  blockId: string;
  createdAt: string;
  updatedAt: string;
  block: {
    code: string;
    name: string;
  };
}

const tabs = [
  { id: 'project-types', name: 'Project Types', icon: Settings },
  { id: 'tiers', name: 'Tiers', icon: Settings },
  { id: 'blocks', name: 'Blocks', icon: Settings },
  { id: 'deliverables', name: 'Deliverables', icon: Settings },
  { id: 'skills', name: 'Skills', icon: Settings },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('project-types');
  const [isProjectTypeFormOpen, setIsProjectTypeFormOpen] = useState(false);
  const [isEditProjectTypeFormOpen, setIsEditProjectTypeFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  
  // Tier form states
  const [isEditTierFormOpen, setIsEditTierFormOpen] = useState(false);
  const [isTierDeleteDialogOpen, setIsTierDeleteDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  
  // Skill form states
  const [isEditSkillFormOpen, setIsEditSkillFormOpen] = useState(false);
  const [isSkillDeleteDialogOpen, setIsSkillDeleteDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  
  // Block form states
  const [isEditBlockFormOpen, setIsEditBlockFormOpen] = useState(false);
  const [isBlockDeleteDialogOpen, setIsBlockDeleteDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  
  // Deliverable form states
  const [isEditDeliverableFormOpen, setIsEditDeliverableFormOpen] = useState(false);
  const [isDeliverableDeleteDialogOpen, setIsDeliverableDeleteDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load project types
  const loadProjectTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/master-data/project-types');
      if (!response.ok) {
        throw new Error('Failed to load project types');
      }
      const data = await response.json();
      setProjectTypes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load tiers
  const loadTiers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/master-data/tiers');
      if (!response.ok) {
        throw new Error('Failed to load tiers');
      }
      const data = await response.json();
      setTiers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load skills
  const loadSkills = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/master-data/skills');
      if (!response.ok) {
        throw new Error('Failed to load skills');
      }
      const data = await response.json();
      setSkills(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load blocks
  const loadBlocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/master-data/blocks');
      if (!response.ok) {
        throw new Error('Failed to load blocks');
      }
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error('Error loading blocks:', error);
      setError('Failed to load blocks');
    } finally {
      setIsLoading(false);
    }
  };

  // Load deliverables
  const loadDeliverables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/master-data/deliverables');
      if (!response.ok) {
        throw new Error('Failed to load deliverables');
      }
      const data = await response.json();
      setDeliverables(data);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      setError('Failed to load deliverables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'project-types') {
      loadProjectTypes();
    } else if (activeTab === 'tiers') {
      loadTiers();
    } else if (activeTab === 'skills') {
      loadSkills();
    } else if (activeTab === 'blocks') {
      loadBlocks();
    } else if (activeTab === 'deliverables') {
      loadDeliverables();
    }
  }, [activeTab]);

  const handleProjectTypeSuccess = () => {
    loadProjectTypes();
  };

  const handleEditProjectType = (projectType: ProjectType) => {
    setSelectedProjectType(projectType);
    setIsEditProjectTypeFormOpen(true);
  };

  const handleDeleteProjectType = (projectType: ProjectType) => {
    setSelectedProjectType(projectType);
    setIsDeleteDialogOpen(true);
  };

  const handleTierSuccess = () => {
    loadTiers();
  };

  const handleEditTier = (tier: Tier) => {
    setSelectedTier(tier);
    setIsEditTierFormOpen(true);
  };

  const handleDeleteTier = (tier: Tier) => {
    setSelectedTier(tier);
    setIsTierDeleteDialogOpen(true);
  };

  const handleSkillSuccess = () => {
    loadSkills();
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsEditSkillFormOpen(true);
  };

  const handleDeleteSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsSkillDeleteDialogOpen(true);
  };

  // Blocks handlers
  const handleBlockSuccess = () => {
    loadBlocks();
  };

  const handleEditBlock = (block: Block) => {
    setSelectedBlock(block);
    setIsEditBlockFormOpen(true);
  };

  const handleDeleteBlock = (block: Block) => {
    setSelectedBlock(block);
    setIsBlockDeleteDialogOpen(true);
  };

  // Deliverables handlers
  const handleDeliverableSuccess = () => {
    loadDeliverables();
  };

  const handleEditDeliverable = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setIsEditDeliverableFormOpen(true);
  };

  const handleDeleteDeliverable = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setIsDeliverableDeleteDialogOpen(true);
  };

  const renderProjectTypes = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadProjectTypes}
            className="mt-2 btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (projectTypes.length === 0) {
      return (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No project types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new project type.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsProjectTypeFormOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add project type
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search project types..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setIsProjectTypeFormOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Project Type
          </button>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectTypes.map((projectType) => (
                <tr key={projectType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {projectType.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {projectType.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {projectType.description || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      projectType.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {projectType.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditProjectType(projectType)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit project type"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProjectType(projectType)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete project type"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTiers = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadTiers}
            className="mt-2 btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (tiers.length === 0) {
      return (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tiers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tiers define project sizes within each project type.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size Hint
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tiers.map((tier) => (
              <tr key={tier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tier.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tier.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tier.projectType.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {tier.sizeHint || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditTier(tier)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTier(tier)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSkills = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadSkills}
            className="mt-2 btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (skills.length === 0) {
      return (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No skills configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Skills define the capabilities available for project planning.
          </p>
        </div>
      );
    }

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    return (
      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{category}</h3>
              <p className="text-sm text-gray-500">{categorySkills.length} skills</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {skill.code}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="mt-2 text-sm font-medium text-gray-900">
                      {skill.name}
                    </h4>
                    {skill.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {skill.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBlocks = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadBlocks}
            className="mt-2 btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (blocks.length === 0) {
      return (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No blocks configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Blocks define reusable project components with standard durations and skill mixes.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => (
          <div key={block.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {block.code}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditBlock(block)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(block)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">{block.name}</h3>
              {block.description && (
                <p className="mt-1 text-sm text-gray-500">{block.description}</p>
              )}
              
              <div className="mt-4 space-y-2">
                {block.defaultDurationWeeks && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Duration:</span>
                    <span className="ml-1">{block.defaultDurationWeeks} weeks</span>
                  </div>
                )}
                
                {block._count && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Used in {block._count.tierBlocks} tiers</span>
                    <span>Used in {block._count.projectBlocks} projects</span>
                  </div>
                )}
                
                {block._count?.deliverables && block._count.deliverables > 0 && (
                  <div className="text-xs text-gray-500">
                    {block._count.deliverables} deliverables
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDeliverables = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadDeliverables}
            className="mt-2 btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    if (deliverables.length === 0) {
      return (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No deliverables configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Deliverables define the expected outputs and artifacts for each block.
          </p>
        </div>
      );
    }

    // Group deliverables by block
    const deliverablesByBlock = deliverables.reduce((acc, deliverable) => {
      const blockKey = `${deliverable.block.code} - ${deliverable.block.name}`;
      if (!acc[blockKey]) {
        acc[blockKey] = [];
      }
      acc[blockKey].push(deliverable);
      return acc;
    }, {} as Record<string, Deliverable[]>);

    return (
      <div className="space-y-6">
        {Object.entries(deliverablesByBlock).map(([blockName, blockDeliverables]) => (
          <div key={blockName} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{blockName}</h3>
              <p className="text-sm text-gray-500">{blockDeliverables.length} deliverables</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockDeliverables.map((deliverable) => (
                  <div key={deliverable.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {deliverable.code}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditDeliverable(deliverable)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeliverable(deliverable)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="mt-2 text-sm font-medium text-gray-900">
                      {deliverable.name}
                    </h4>
                    {deliverable.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {deliverable.description}
                      </p>
                    )}
                    {(deliverable.qualityCriteria || deliverable.acceptanceMetrics) && (
                      <div className="mt-2 space-y-1">
                        {deliverable.qualityCriteria && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Quality:</span> {deliverable.qualityCriteria.length > 50 ? deliverable.qualityCriteria.substring(0, 50) + '...' : deliverable.qualityCriteria}
                          </div>
                        )}
                        {deliverable.acceptanceMetrics && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Acceptance:</span> {deliverable.acceptanceMetrics.length > 50 ? deliverable.acceptanceMetrics.substring(0, 50) + '...' : deliverable.acceptanceMetrics}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'project-types':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Types</h3>
                <p className="text-sm text-gray-600">
                  Define the different types of projects your organization manages
                </p>
              </div>
              <button
                onClick={() => setIsProjectTypeFormOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project Type
              </button>
            </div>
            {renderProjectTypes()}
          </div>
        );
      case 'tiers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tiers</h3>
                <p className="text-sm text-gray-600">
                  Define project sizes within each project type
                </p>
              </div>
              <CreateTierForm onSuccess={handleTierSuccess} />
            </div>
            {renderTiers()}
          </div>
        );
      case 'blocks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Blocks</h3>
                <p className="text-sm text-gray-600">
                  Define reusable project components with standard durations and skill mixes
                </p>
              </div>
              <CreateBlockForm onSuccess={handleBlockSuccess} />
            </div>
            {renderBlocks()}
          </div>
        );
      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
                <p className="text-sm text-gray-600">
                  Define standard deliverables and outputs for each block
                </p>
              </div>
              <CreateDeliverableForm onSuccess={handleDeliverableSuccess} />
            </div>
            {renderDeliverables()}
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                <p className="text-sm text-gray-600">
                  Define the skills and capabilities available for project planning
                </p>
              </div>
              <CreateSkillForm onSuccess={handleSkillSuccess} />
            </div>
            {renderSkills()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <Home className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Home</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="ml-2 text-sm font-medium text-gray-900">Master Data</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Master Data Management</h1>
            <p className="mt-2 text-gray-600">
              Configure and manage foundational data for the PMPRG system.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Forms */}
      <ProjectTypeForm
        isOpen={isProjectTypeFormOpen}
        onClose={() => setIsProjectTypeFormOpen(false)}
        onSuccess={handleProjectTypeSuccess}
      />
      
      <EditProjectTypeForm
        isOpen={isEditProjectTypeFormOpen}
        onClose={() => setIsEditProjectTypeFormOpen(false)}
        onSuccess={handleProjectTypeSuccess}
        projectType={selectedProjectType}
      />

      <DeleteProjectTypeDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleProjectTypeSuccess}
        projectType={selectedProjectType}
      />

      <EditTierForm
        isOpen={isEditTierFormOpen}
        onClose={() => setIsEditTierFormOpen(false)}
        onSuccess={handleTierSuccess}
        tier={selectedTier}
      />

      <DeleteTierDialog
        isOpen={isTierDeleteDialogOpen}
        onClose={() => setIsTierDeleteDialogOpen(false)}
        onSuccess={handleTierSuccess}
        tier={selectedTier}
      />

      <EditSkillForm
        isOpen={isEditSkillFormOpen}
        onClose={() => setIsEditSkillFormOpen(false)}
        onSuccess={handleSkillSuccess}
        skill={selectedSkill}
      />

      <DeleteSkillDialog
        isOpen={isSkillDeleteDialogOpen}
        onClose={() => setIsSkillDeleteDialogOpen(false)}
        onSuccess={handleSkillSuccess}
        skill={selectedSkill}
      />

      <EditBlockForm
        isOpen={isEditBlockFormOpen}
        onClose={() => setIsEditBlockFormOpen(false)}
        onSuccess={handleBlockSuccess}
        block={selectedBlock}
      />

      <DeleteBlockDialog
        isOpen={isBlockDeleteDialogOpen}
        onClose={() => setIsBlockDeleteDialogOpen(false)}
        onSuccess={handleBlockSuccess}
        block={selectedBlock}
      />

      <EditDeliverableForm
        isOpen={isEditDeliverableFormOpen}
        onClose={() => setIsEditDeliverableFormOpen(false)}
        onSuccess={handleDeliverableSuccess}
        deliverable={selectedDeliverable}
      />

      <DeleteDeliverableDialog
        isOpen={isDeliverableDeleteDialogOpen}
        onClose={() => setIsDeliverableDeleteDialogOpen(false)}
        onSuccess={handleDeliverableSuccess}
        deliverable={selectedDeliverable}
      />
    </div>
  );
}