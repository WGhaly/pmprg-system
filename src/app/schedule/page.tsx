'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Settings,
  Home,
  AlertTriangle,
  Clock,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Edit,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: number;
  targetStartDate: string;
  projectType: {
    name: string;
    code: string;
  };
  tier: {
    name: string;
    code: string;
  };
  projectBlocks: Array<{
    id: string;
    plannedStart: string;
    plannedEnd: string;
    plannedDurationWeeks: number;
    status: string;
    block: {
      name: string;
      code: string;
    };
    allocations: Array<{
      resource: {
        id: string;
        name: string;
        employeeCode: string;
      };
      allocatedHours: number;
    }>;
  }>;
}

interface Resource {
  id: string;
  name: string;
  employeeCode: string;
  employmentType: string;
  homeTeam: string;
  capacityHoursPerWeek: number;
  monthlyRate: number;
  active: boolean;
  resourceSkills: Array<{
    skill: {
      name: string;
      code: string;
      category: string;
    };
    level: number;
  }>;
}

interface ResourceUtilization {
  resourceId: string;
  resource: Resource;
  periods: Array<{
    startDate: string;
    endDate: string;
    allocatedHours: number;
    capacityHours: number;
    utilizationPercentage: number;
    projects: Array<{
      projectId: string;
      projectName: string;
      projectCode: string;
      hours: number;
    }>;
  }>;
  averageUtilization: number;
  peakUtilization: number;
  isOverutilized: boolean;
  isUnderutilized: boolean;
}

interface ProjectAdjustment {
  projectId: string;
  newStartDate: string;
  reason: string;
  impact: {
    resourceUtilization: number;
    overallEfficiency: number;
  };
}

interface UtilizationRecommendation {
  type: 'shift_project' | 'add_resource' | 'reduce_scope';
  title: string;
  description: string;
  projects?: Array<ProjectAdjustment>;
  expectedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

const ResourceUtilizationTimeline = ({ 
  utilizations, 
  projects, 
  timePeriods, 
  viewMode,
  onProjectDateChange,
  onShowRecommendations 
}: {
  utilizations: ResourceUtilization[];
  projects: Project[];
  timePeriods: string[];
  viewMode: 'week' | 'month' | 'year';
  onProjectDateChange: (projectId: string, newStartDate: string) => void;
  onShowRecommendations: () => void;
}) => {
  const [selectedResource, setSelectedResource] = React.useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-500';
    if (utilization > 80) return 'bg-orange-500';
    if (utilization > 60) return 'bg-green-500';
    if (utilization > 40) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getUtilizationIcon = (utilization: number) => {
    if (utilization > 100) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (utilization < 40) return <TrendingDown className="h-4 w-4 text-blue-600" />;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 border-b pb-2">
        <div className="col-span-3">Resource</div>
        {timePeriods.slice(0, 9).map((period, index) => (
          <div key={period} className="text-center">
            {viewMode === 'week' ? `W${index + 1}` : 
             viewMode === 'month' ? new Date(period).toLocaleDateString('en', { month: 'short' }) :
             new Date(period).getFullYear()}
          </div>
        ))}
      </div>

      {/* Resource Rows */}
      {utilizations.map((resourceUtil) => (
        <div key={resourceUtil.resourceId} className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-gray-50 rounded">
          {/* Resource Info */}
          <div className="col-span-3 flex items-center space-x-2">
            <div>
              <div className="font-medium text-gray-900">{resourceUtil.resource.name}</div>
              <div className="text-sm text-gray-500">{resourceUtil.resource.employeeCode}</div>
              <div className="text-xs text-gray-400">{resourceUtil.resource.homeTeam}</div>
            </div>
            <div className="flex items-center space-x-1">
              {resourceUtil.isOverutilized && (
                <Badge variant="destructive" className="text-xs">
                  Over {Math.round(resourceUtil.peakUtilization)}%
                </Badge>
              )}
              {resourceUtil.isUnderutilized && (
                <Badge variant="outline" className="text-xs">
                  Under {Math.round(resourceUtil.averageUtilization)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Utilization Periods */}
          {resourceUtil.periods.slice(0, 9).map((period, index) => (
            <div 
              key={index}
              className="relative h-12 rounded cursor-pointer"
              onClick={() => {
                setSelectedResource(resourceUtil.resourceId);
                setSelectedPeriod(period.startDate);
              }}
            >
              <div 
                className={`h-full rounded ${getUtilizationColor(period.utilizationPercentage)} opacity-80`}
                style={{ 
                  height: `${Math.min(period.utilizationPercentage, 100)}%`,
                  minHeight: period.utilizationPercentage > 0 ? '8px' : '0'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {Math.round(period.utilizationPercentage)}%
                  </span>
                  {getUtilizationIcon(period.utilizationPercentage)}
                </div>
              </div>
              
              {/* Project tooltips on hover */}
              {period.projects.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-black text-white text-xs p-1 rounded shadow-lg">
                    {period.projects.map(proj => (
                      <div key={proj.projectId} className="flex justify-between">
                        <span>{proj.projectCode}</span>
                        <span>{proj.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Optimization Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Optimization Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={onShowRecommendations}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Analyze & Optimize</span>
            </Button>
            
            <div className="text-sm text-gray-600">
              Over-utilized resources: {utilizations.filter(u => u.isOverutilized).length} | 
              Under-utilized: {utilizations.filter(u => u.isUnderutilized).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Detail Modal */}
      {selectedResource && selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>Resource Details</CardTitle>
              <Button 
                variant="ghost" 
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedResource(null);
                  setSelectedPeriod(null);
                }}
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              {(() => {
                const resource = utilizations.find(u => u.resourceId === selectedResource);
                const period = resource?.periods.find(p => p.startDate === selectedPeriod);
                
                if (!resource || !period) return null;
                
                return (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{resource.resource.name}</h4>
                      <p className="text-sm text-gray-600">{resource.resource.employeeCode}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm"><strong>Utilization:</strong> {Math.round(period.utilizationPercentage)}%</p>
                      <p className="text-sm"><strong>Allocated:</strong> {period.allocatedHours}h / {period.capacityHours}h</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-1">Projects:</h5>
                      {period.projects.map(proj => (
                        <div key={proj.projectId} className="flex justify-between text-sm border-b py-1">
                          <span>{proj.projectName}</span>
                          <span>{proj.hours}h</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Open project edit modal
                              const project = projects.find(p => p.id === proj.projectId);
                              if (project) {
                                // This would open a date picker to adjust start date
                                const newDate = prompt('New start date (YYYY-MM-DD):', project.targetStartDate);
                                if (newDate) {
                                  onProjectDateChange(proj.projectId, newDate);
                                }
                              }
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

interface GanttBarProps {
  block: Project['projectBlocks'][0];
  projectId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  index: number;
}

const GanttBar: React.FC<GanttBarProps> = ({ block, startDate, endDate, totalDays, index }) => {
  const blockStart = new Date(block.plannedStart);
  const blockEnd = new Date(block.plannedEnd);
  
  const daysDiff = (date1: Date, date2: Date) => 
    Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  
  const leftOffset = Math.max(0, daysDiff(blockStart, startDate)) / totalDays * 100;
  const width = daysDiff(blockEnd, blockStart) / totalDays * 100;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'at_risk': return 'bg-orange-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="relative h-8 bg-gray-100 rounded mb-2">
      <div
        className={`absolute h-6 top-1 rounded ${getStatusColor(block.status)} flex items-center px-2`}
        style={{
          left: `${leftOffset}%`,
          width: `${Math.max(width, 2)}%`
        }}
      >
        <span className="text-xs text-white font-medium truncate">
          {block.block.name}
        </span>
      </div>
      <div className="absolute right-2 top-1 text-xs text-gray-600">
        {block.plannedDurationWeeks}w
      </div>
    </div>
  );
};

export default function SchedulePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [utilizations, setUtilizations] = useState<ResourceUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('month');
  const [displayMode, setDisplayMode] = useState<'timeline' | 'utilization'>('utilization');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recommendations, setRecommendations] = useState<UtilizationRecommendation[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchResources();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && resources.length > 0) {
      calculateUtilizations();
    }
  }, [projects, resources, viewMode, currentDate]);

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

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const calculateUtilizations = () => {
    if (!resources || !projects || resources.length === 0) {
      setUtilizations([]);
      return;
    }

    const { startDate, endDate, periods } = getDateRange();
    
    const resourceUtilizations: ResourceUtilization[] = resources.map((resource: Resource) => {
      const resourcePeriods = periods.map((periodStart: Date) => {
        const periodEnd = new Date(periodStart);
        if (viewMode === 'week') {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else if (viewMode === 'month') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        let totalAllocatedHours = 0;
        const projectAllocations: Array<{
          projectId: string;
          projectName: string;
          projectCode: string;
          hours: number;
        }> = [];

        // Calculate allocations for this period
        projects.forEach((project: Project) => {
          if (project.projectBlocks) {
            project.projectBlocks.forEach((block: any) => {
              const blockStart = new Date(block.plannedStart);
              const blockEnd = new Date(block.plannedEnd);
              
              if (blockStart <= periodEnd && blockEnd >= new Date(periodStart)) {
                const allocation = block.allocations?.find((a: any) => a.resource.id === resource.id);
                if (allocation) {
                  const hours = allocation.allocatedHours;
                  totalAllocatedHours += hours;
                  projectAllocations.push({
                    projectId: project.id,
                    projectName: project.name,
                    projectCode: project.code,
                    hours
                  });
                }
              }
            });
          }
        });

        const capacityHours = viewMode === 'week' ? resource.capacityHoursPerWeek : 
                            viewMode === 'month' ? resource.capacityHoursPerWeek * 4 :
                            resource.capacityHoursPerWeek * 52;

        return {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
          allocatedHours: totalAllocatedHours,
          capacityHours,
          utilizationPercentage: (totalAllocatedHours / capacityHours) * 100,
          projects: projectAllocations
        };
      });

      const averageUtilization = resourcePeriods.reduce((sum: number, p: any) => sum + p.utilizationPercentage, 0) / resourcePeriods.length;
      const peakUtilization = Math.max(...resourcePeriods.map((p: any) => p.utilizationPercentage));

      return {
        resourceId: resource.id,
        resource,
        periods: resourcePeriods,
        averageUtilization,
        peakUtilization,
        isOverutilized: peakUtilization > 100,
        isUnderutilized: averageUtilization < 40
      };
    });

    setUtilizations(resourceUtilizations);
  };

  const handleProjectDateChange = async (projectId: string, newStartDate: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStartDate: newStartDate })
      });

      if (response.ok) {
        await fetchProjects(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating project date:', error);
    }
  };

  const generateRecommendations = () => {
    if (!utilizations || utilizations.length === 0) {
      setRecommendations([]);
      return;
    }

    const newRecommendations: UtilizationRecommendation[] = [];

    // Find overutilized resources
    const overutilized = utilizations.filter((u: ResourceUtilization) => u.isOverutilized);
    
    if (overutilized.length > 0) {
      newRecommendations.push({
        type: 'shift_project',
        title: 'Shift Project Start Dates',
        description: `${overutilized.length} resources are overutilized. Consider shifting project start dates to balance workload.`,
        expectedImprovement: 25,
        priority: 'high'
      });
    }

    // Find underutilized resources
    const underutilized = utilizations.filter((u: ResourceUtilization) => u.isUnderutilized);
    
    if (underutilized.length > 0) {
      newRecommendations.push({
        type: 'add_resource',
        title: 'Optimize Resource Allocation',
        description: `${underutilized.length} resources have low utilization. Consider reallocating work or reducing team size.`,
        expectedImprovement: 15,
        priority: 'medium'
      });
    }

    setRecommendations(newRecommendations);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getDateRange = () => {
    const now = new Date(currentDate);
    let startDate = new Date(now);
    let endDate = new Date(now);
    const periods: Date[] = [];
    
    switch (viewMode) {
      case 'week':
        // Get start of week
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (9 * 7)); // 9 weeks
        
        // Generate weekly periods
        for (let i = 0; i < 9; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(weekStart.getDate() + (i * 7));
          periods.push(weekStart);
        }
        break;
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 9, 0); // 9 months
        
        // Generate monthly periods
        for (let i = 0; i < 9; i++) {
          const monthStart = new Date(startDate);
          monthStart.setMonth(monthStart.getMonth() + i, 1);
          periods.push(monthStart);
        }
        break;
      case 'year':
        startDate.setMonth(0, 1);
        endDate.setFullYear(endDate.getFullYear() + 9, 11, 31); // 9 years
        
        // Generate yearly periods
        for (let i = 0; i < 9; i++) {
          const yearStart = new Date(startDate);
          yearStart.setFullYear(yearStart.getFullYear() + i, 0, 1);
          periods.push(yearStart);
        }
        break;
    }
    
    return { startDate, endDate, periods };
  };

  const { startDate, endDate } = getDateRange();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority.toString() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const generateTimeScale = () => {
    try {
      const { periods } = getDateRange();
      return periods;
    } catch (error) {
      console.error('Error generating time scale:', error);
      return [];
    }
  };

  const timeScale = generateTimeScale();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

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
              <Calendar className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Project Schedule</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters and Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </Select>
                <Select value={priorityFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="1">High Priority</option>
                  <option value="2">Medium Priority</option>
                  <option value="3">Low Priority</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => navigateTime('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-medium text-gray-900">
                  {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
                  {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {viewMode === 'year' && currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateTime('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                {/* Display Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={displayMode === 'utilization' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDisplayMode('utilization')}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Resource Utilization
                  </Button>
                  <Button
                    variant={displayMode === 'timeline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDisplayMode('timeline')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Project Timeline
                  </Button>
                </div>
                
                {/* Time Range Toggle */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('year')}
                  >
                    Year
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Conditional Rendering */}
        {displayMode === 'utilization' ? (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Resource Utilization Timeline</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Over-utilized: <span className="font-medium text-red-600">{utilizations?.filter((u: ResourceUtilization) => u.isOverutilized).length || 0}</span> |
                    Under-utilized: <span className="font-medium text-blue-600">{utilizations?.filter((u: ResourceUtilization) => u.isUnderutilized).length || 0}</span>
                  </div>
                </div>
              </div>
              
              <ResourceUtilizationTimeline
                utilizations={utilizations}
                projects={projects}
                timePeriods={generateTimeScale().map(d => d.toISOString())}
                viewMode={viewMode}
                onProjectDateChange={handleProjectDateChange}
                onShowRecommendations={generateRecommendations}
              />
              
              {/* Recommendations Panel */}
              {recommendations.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span>Optimization Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{rec.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            </div>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'outline'}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-green-600">
                            Expected improvement: +{rec.expectedImprovement}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Project Timeline View */
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
              
              {/* Time Scale */}
              <div className="mb-4 pb-2 border-b border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  {timeScale.map((date, index) => (
                    <div key={index} className="flex-1 text-center">
                      {viewMode === 'week' && `Week ${index + 1}`}
                      {viewMode === 'month' && date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {viewMode === 'year' && `Q${Math.floor(date.getMonth() / 3) + 1}`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Rows */}
              <div className="space-y-6">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No projects found matching your criteria</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline">
                          Priority {project.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {project.projectType.name}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {(project.projectBlocks || []).reduce((total, block) => total + (block.allocations?.length || 0), 0)} resources
                        </div>
                      </div>
                    </div>
                    
                    {/* Block Timeline */}
                    <div className="space-y-1">
                      {(project.projectBlocks || []).map((block, index) => (
                        <GanttBar
                          key={block.id}
                          block={block}
                          projectId={project.id}
                          startDate={startDate}
                          endDate={endDate}
                          totalDays={totalDays}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {/* Schedule Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.filter(p => p.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {filteredProjects.length} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocks This Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.reduce((total, project) => total + (project.projectBlocks || []).length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.reduce((total, project) => 
                  total + (project.projectBlocks || []).filter(block => block.status === 'at_risk').length, 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                blocks need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProjects.length > 0 
                  ? Math.round(
                      filteredProjects.reduce((total, project) => 
                        total + (project.projectBlocks || []).reduce((sum, block) => sum + (block.plannedDurationWeeks || 0), 0), 0
                      ) / filteredProjects.length
                    )
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">
                weeks per project
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}