'use client';

import { useState, useEffect } from 'react';
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
  Target
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
        name: string;
        employeeCode: string;
      };
      allocatedHours: number;
    }>;
  }>;
}

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDateRange = () => {
    const now = new Date(currentDate);
    let startDate = new Date(now);
    let endDate = new Date(now);
    
    switch (viewMode) {
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        endDate.setMonth(quarter * 3 + 3, 0);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
        break;
    }
    
    return { startDate, endDate };
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
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const generateTimeScale = () => {
    const timePoints = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      timePoints.push(new Date(current));
      switch (viewMode) {
        case 'month':
          current.setDate(current.getDate() + 7); // Weekly markers
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 1); // Monthly markers
          break;
        case 'year':
          current.setMonth(current.getMonth() + 3); // Quarterly markers
          break;
      }
    }
    
    return timePoints;
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
                  {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {viewMode === 'quarter' && `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`}
                  {viewMode === 'year' && currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateTime('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('quarter')}
                >
                  Quarter
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

        {/* Gantt Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline View</h3>
            
            {/* Time Scale */}
            <div className="mb-4 pb-2 border-b border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                {timeScale.map((date, index) => (
                  <div key={index} className="flex-1 text-center">
                    {viewMode === 'month' && date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {viewMode === 'quarter' && date.toLocaleDateString('en-US', { month: 'short' })}
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
                          {project.projectBlocks.reduce((total, block) => total + block.allocations.length, 0)} resources
                        </div>
                      </div>
                    </div>
                    
                    {/* Block Timeline */}
                    <div className="space-y-1">
                      {project.projectBlocks.map((block, index) => (
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
                {filteredProjects.reduce((total, project) => total + project.projectBlocks.length, 0)}
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
                  total + project.projectBlocks.filter(block => block.status === 'at_risk').length, 0
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
                        total + project.projectBlocks.reduce((sum, block) => sum + block.plannedDurationWeeks, 0), 0
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