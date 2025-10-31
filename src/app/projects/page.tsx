'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Calendar, Users, DollarSign, Home, Search, Filter, Edit, Play, Pause, CheckCircle, MoreVertical, UserCheck } from 'lucide-react';
import ProjectCreationWizard from '@/components/projects/ProjectCreationWizard';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: number;
  targetStartDate: string;
  mode: string;
  budgetCapex?: number;
  budgetOpex?: number;
  createdAt: string;
  projectType: {
    code: string;
    name: string;
  };
  tier: {
    code: string;
    name: string;
  };
  _count: {
    projectBlocks: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [allocatingResources, setAllocatingResources] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    setUpdatingStatus(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchProjects(); // Refresh the projects list
      } else {
        console.error('Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusActions = (project: Project) => {
    const actions = [];
    
    switch (project.status) {
      case 'planning':
        actions.push({
          label: 'Start Project',
          icon: Play,
          action: () => updateProjectStatus(project.id, 'active'),
          color: 'text-green-600 hover:text-green-800'
        });
        break;
      case 'active':
        actions.push({
          label: 'Pause Project',
          icon: Pause,
          action: () => updateProjectStatus(project.id, 'on_hold'),
          color: 'text-yellow-600 hover:text-yellow-800'
        });
        actions.push({
          label: 'Complete Project',
          icon: CheckCircle,
          action: () => updateProjectStatus(project.id, 'completed'),
          color: 'text-green-600 hover:text-green-800'
        });
        break;
      case 'on_hold':
        actions.push({
          label: 'Resume Project',
          icon: Play,
          action: () => updateProjectStatus(project.id, 'active'),
          color: 'text-green-600 hover:text-green-800'
        });
        break;
    }
    
    return actions;
  };

  const allocateResources = async (projectId: string) => {
    setAllocatingResources(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Resources allocated:', result);
        alert(`Successfully allocated resources! Created ${result.allocations?.allocations?.length || 0} allocations.`);
      } else {
        const error = await response.json();
        console.error('Failed to allocate resources:', error);
        alert('Failed to allocate resources. Please try again.');
      }
    } catch (error) {
      console.error('Error allocating resources:', error);
      alert('Error allocating resources. Please try again.');
    } finally {
      setAllocatingResources(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    if (priority <= 2) return 'High';
    if (priority <= 5) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-600';
    if (priority <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.projectType.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <Home className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Home</span>
              </Link>
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Projects</h1>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="btn-primary flex items-center"
              data-testid="create-project-button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Page Description */}
          <div className="mb-6">
            <p className="text-gray-600">
              Manage your projects with auto-planning and resource allocation. Create new projects using the Project Creation Wizard
              which automatically generates project structures based on your master data configuration.
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Statuses</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Projects List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {projects.length === 0 
                  ? "Get started by creating your first project."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {projects.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowWizard(true)}
                    className="btn-primary"
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  const totalBudget = (project.budgetCapex || 0) + (project.budgetOpex || 0);
                  
                  return (
                    <li key={project.id}>
                      <div className="px-4 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                  {project.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {project.code} • {project.projectType.name} ({project.tier.name})
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                  {project.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                                  {getPriorityLabel(project.priority)} Priority
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-500 space-x-6">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Start: {formatDate(project.targetStartDate)}
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {project._count.projectBlocks} blocks
                                </div>
                                <div className="flex items-center">
                                  <span className="capitalize">{project.mode.replace('_', ' ')}</span>
                                </div>
                                {totalBudget > 0 && (
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    {formatCurrency(totalBudget)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                {getStatusActions(project).map((action, index) => (
                                  <button
                                    key={index}
                                    onClick={action.action}
                                    disabled={updatingStatus === project.id}
                                    className={`p-2 rounded-full ${action.color} hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={action.label}
                                  >
                                    {updatingStatus === project.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    ) : (
                                      <action.icon className="h-4 w-4" />
                                    )}
                                  </button>
                                ))}
                                
                                <button
                                  onClick={() => allocateResources(project.id)}
                                  disabled={allocatingResources === project.id}
                                  className="p-2 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Allocate Resources"
                                >
                                  {allocatingResources === project.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => setEditingProject(project.id)}
                                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                  title="Edit Project"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Stats */}
          {projects.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                        <dd className="text-lg font-medium text-gray-900">{projects.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {projects.filter(p => p.status === 'active').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Planning</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {projects.filter(p => p.status === 'planning').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(
                            projects.reduce((sum, p) => sum + (p.budgetCapex || 0) + (p.budgetOpex || 0), 0)
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Project Creation Wizard */}
      <ProjectCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}