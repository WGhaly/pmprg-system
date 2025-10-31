'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Home,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardKPIs {
  resourceUtilization: {
    average: number;
    efficient: number;
    underutilized: number;
    overutilized: number;
  };
  projectDelivery: {
    onTime: number;
    delayed: number;
    atRisk: number;
    total: number;
    onTimePercentage: number;
  };
  budgetPerformance: {
    totalBudget: number;
    totalSpent: number;
    variance: number;
    variancePercentage: number;
  };
  capacity: {
    totalCapacity: number;
    utilizatedCapacity: number;
    availableCapacity: number;
    averageTimeToFill: number;
  };
}

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
  budgetCapex: number;
  budgetOpex: number;
  projectBlocks: Array<{
    id: string;
    plannedStart: string;
    plannedEnd: string;
    plannedDurationWeeks: number;
    status: string;
    plannedCost: number;
    actualCost: number;
    block: {
      name: string;
      code: string;
    };
    allocations: Array<{
      allocatedHours: number;
      resource: {
        name: string;
        monthlyRate: number;
        capacityHoursPerWeek: number;
        employeeCode: string;
      };
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    resourceUtilization: {
      average: 0,
      efficient: 0,
      underutilized: 0,
      overutilized: 0
    },
    projectDelivery: {
      onTime: 0,
      delayed: 0,
      atRisk: 0,
      total: 0,
      onTimePercentage: 0
    },
    budgetPerformance: {
      totalBudget: 0,
      totalSpent: 0,
      variance: 0,
      variancePercentage: 0
    },
    capacity: {
      totalCapacity: 0,
      utilizatedCapacity: 0,
      availableCapacity: 0,
      averageTimeToFill: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateKPIs();
  }, [projects, resources]);

  const fetchData = async () => {
    try {
      const [projectsResponse, resourcesResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/resources')
      ]);

      if (projectsResponse.ok && resourcesResponse.ok) {
        const projectsData = await projectsResponse.json();
        const resourcesData = await resourcesResponse.json();
        setProjects(projectsData);
        setResources(resourcesData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = () => {
    if (projects.length === 0 && resources.length === 0) return;

    // Calculate Resource Utilization
    const totalCapacity = resources.reduce((sum, resource) => 
      sum + (resource.active ? resource.capacityHoursPerWeek : 0), 0);
    
    const totalAllocated = projects.reduce((sum, project) => 
      sum + (project.projectBlocks || []).reduce((blockSum, block) => 
        blockSum + (block.allocations || []).reduce((allocSum, alloc) => 
          allocSum + alloc.allocatedHours, 0), 0), 0);

    const averageUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

    // Calculate resource efficiency categories
    const resourceUtilization = resources.map(resource => {
      const allocated = projects.reduce((sum, project) => 
        sum + (project.projectBlocks || []).reduce((blockSum, block) => 
          blockSum + (block.allocations || [])
            .filter(alloc => alloc.resource.employeeCode === resource.employeeCode)
            .reduce((allocSum, alloc) => allocSum + alloc.allocatedHours, 0), 0), 0);
      
      return {
        resource,
        utilization: resource.capacityHoursPerWeek > 0 ? (allocated / resource.capacityHoursPerWeek) * 100 : 0
      };
    });

    const efficient = resourceUtilization.filter(r => r.utilization >= 50 && r.utilization <= 100).length;
    const underutilized = resourceUtilization.filter(r => r.utilization < 50).length;
    const overutilized = resourceUtilization.filter(r => r.utilization > 100).length;

    // Calculate Project Delivery Performance
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'completed');
    const onTimeProjects = activeProjects.filter(p => {
      const hasDelayedBlocks = (p.projectBlocks || []).some(block => block.status === 'delayed');
      return !hasDelayedBlocks && p.status === 'completed';
    }).length;

    const atRiskProjects = activeProjects.filter(p => 
      (p.projectBlocks || []).some(block => block.status === 'at_risk')).length;
    
    const delayedProjects = activeProjects.filter(p => 
      (p.projectBlocks || []).some(block => block.status === 'delayed')).length;

    const onTimePercentage = activeProjects.length > 0 ? (onTimeProjects / activeProjects.length) * 100 : 0;

    // Calculate Budget Performance
    const totalBudget = projects.reduce((sum, p) => sum + (p.budgetCapex || 0) + (p.budgetOpex || 0), 0);
    const totalSpent = projects.reduce((sum, p) => 
      sum + (p.projectBlocks || []).reduce((blockSum, block) => blockSum + (block.actualCost || 0), 0), 0);
    const budgetVariance = totalBudget - totalSpent;
    const budgetVariancePercentage = totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0;

    setKpis({
      resourceUtilization: {
        average: averageUtilization,
        efficient,
        underutilized,
        overutilized
      },
      projectDelivery: {
        onTime: onTimeProjects,
        delayed: delayedProjects,
        atRisk: atRiskProjects,
        total: activeProjects.length,
        onTimePercentage
      },
      budgetPerformance: {
        totalBudget,
        totalSpent,
        variance: budgetVariance,
        variancePercentage: budgetVariancePercentage
      },
      capacity: {
        totalCapacity,
        utilizatedCapacity: totalAllocated,
        availableCapacity: totalCapacity - totalAllocated,
        averageTimeToFill: 7 // Mock data - would need actual tracking
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Chart data preparation
  const utilizationData = [
    { name: 'Efficient (50-100%)', value: kpis.resourceUtilization.efficient, color: '#00C49F' },
    { name: 'Under-utilized (<50%)', value: kpis.resourceUtilization.underutilized, color: '#FFBB28' },
    { name: 'Over-utilized (>100%)', value: kpis.resourceUtilization.overutilized, color: '#FF8042' }
  ];

  const projectStatusData = [
    { name: 'On Time', value: kpis.projectDelivery.onTime, color: '#00C49F' },
    { name: 'At Risk', value: kpis.projectDelivery.atRisk, color: '#FFBB28' },
    { name: 'Delayed', value: kpis.projectDelivery.delayed, color: '#FF8042' }
  ];

  const budgetTrendData = projects.map(project => ({
    name: project.code,
    budget: (project.budgetCapex || 0) + (project.budgetOpex || 0),
    spent: (project.projectBlocks || []).reduce((sum, block) => sum + (block.actualCost || 0), 0),
    variance: ((project.budgetCapex || 0) + (project.budgetOpex || 0)) - 
              (project.projectBlocks || []).reduce((sum, block) => sum + (block.actualCost || 0), 0)
  }));

  const skillsData = resources.reduce((acc, resource) => {
    (resource.resourceSkills || []).forEach(rs => {
      const category = rs.skill.category;
      const existing = acc.find(item => item.name === category);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: category, value: 1 });
      }
    });
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <BarChart3 className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Executive Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(kpis.resourceUtilization.average)}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.resourceUtilization.efficient} efficient, {kpis.resourceUtilization.underutilized} underutilized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects On Time</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(kpis.projectDelivery.onTimePercentage)}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.projectDelivery.onTime} of {kpis.projectDelivery.total} projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.budgetPerformance.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpis.budgetPerformance.variance >= 0 ? '+' : ''}{formatPercentage(kpis.budgetPerformance.variancePercentage)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(Math.abs(kpis.budgetPerformance.variance))} {kpis.budgetPerformance.variance >= 0 ? 'under' : 'over'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Fill</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.capacity.averageTimeToFill} days</div>
              <p className="text-xs text-muted-foreground">
                Resource gap resolution time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization Distribution</CardTitle>
              <CardDescription>Distribution of resource utilization efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Delivery Status</CardTitle>
              <CardDescription>Current status of active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Performance by Project</CardTitle>
              <CardDescription>Budget vs actual spending across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills Distribution</CardTitle>
              <CardDescription>Team skills by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillsData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpis.resourceUtilization.overutilized > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {kpis.resourceUtilization.overutilized} resources over-utilized
                      </p>
                      <p className="text-xs text-red-600">Review resource allocation</p>
                    </div>
                  </div>
                )}

                {kpis.projectDelivery.atRisk > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {kpis.projectDelivery.atRisk} projects at risk
                      </p>
                      <p className="text-xs text-yellow-600">Review project schedules</p>
                    </div>
                  </div>
                )}

                {kpis.budgetPerformance.variance < 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Budget overrun detected
                      </p>
                      <p className="text-xs text-red-600">{formatCurrency(Math.abs(kpis.budgetPerformance.variance))} over budget</p>
                    </div>
                  </div>
                )}

                {kpis.resourceUtilization.overutilized === 0 && 
                 kpis.projectDelivery.atRisk === 0 && 
                 kpis.budgetPerformance.variance >= 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        All systems operating normally
                      </p>
                      <p className="text-xs text-green-600">No critical issues detected</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity Overview</CardTitle>
              <CardDescription>Resource capacity and utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Capacity</span>
                  <span className="text-sm font-bold">{kpis.capacity.totalCapacity.toFixed(0)} hrs/week</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Utilized</span>
                  <span className="text-sm text-blue-600 font-bold">{kpis.capacity.utilizatedCapacity.toFixed(0)} hrs/week</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Available</span>
                  <span className="text-sm text-green-600 font-bold">{kpis.capacity.availableCapacity.toFixed(0)} hrs/week</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${kpis.capacity.totalCapacity > 0 ? (kpis.capacity.utilizatedCapacity / kpis.capacity.totalCapacity) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  {kpis.capacity.totalCapacity > 0 
                    ? `${((kpis.capacity.utilizatedCapacity / kpis.capacity.totalCapacity) * 100).toFixed(1)}% utilized`
                    : 'No capacity data'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}