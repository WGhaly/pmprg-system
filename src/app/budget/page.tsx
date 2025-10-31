'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Download,
  AlertTriangle,
  Home,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  budgetCapex: number;
  budgetOpex: number;
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
    plannedCost: number;
    actualCost: number;
    actualHours: number;
    status: string;
    block: {
      name: string;
      code: string;
    };
    allocations: Array<{
      allocatedHours: number;
      resource: {
        name: string;
        monthlyRate: number;
        employeeCode: string;
      };
    }>;
  }>;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalAllocated: number;
  remainingBudget: number;
  variance: number;
  variancePercentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function BudgetPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    totalBudget: 0,
    totalSpent: 0,
    totalAllocated: 0,
    remainingBudget: 0,
    variance: 0,
    variancePercentage: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    calculateBudgetSummary();
  }, [projects]);

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

  const calculateBudgetSummary = () => {
    if (projects.length === 0) return;

    const summary = projects.reduce((acc, project) => {
      const totalBudget = (project.budgetCapex || 0) + (project.budgetOpex || 0);
      const totalSpent = (project.projectBlocks || []).reduce((sum, block) => sum + (block.actualCost || 0), 0);
      const totalAllocated = (project.projectBlocks || []).reduce((sum, block) => 
        sum + (block.allocations || []).reduce((allocSum, alloc) => 
          allocSum + (alloc.allocatedHours * (alloc.resource.monthlyRate / 160)), 0), 0
      );

      return {
        totalBudget: acc.totalBudget + totalBudget,
        totalSpent: acc.totalSpent + totalSpent,
        totalAllocated: acc.totalAllocated + totalAllocated,
        remainingBudget: acc.remainingBudget + (totalBudget - totalSpent),
        variance: acc.variance + (totalBudget - totalSpent),
        variancePercentage: 0 // Will calculate after
      };
    }, {
      totalBudget: 0,
      totalSpent: 0,
      totalAllocated: 0,
      remainingBudget: 0,
      variance: 0,
      variancePercentage: 0
    });

    summary.variancePercentage = summary.totalBudget > 0 
      ? ((summary.variance / summary.totalBudget) * 100) 
      : 0;

    setBudgetSummary(summary);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.projectType.code === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getProjectTotalBudget = (project: Project) => {
    return (project.budgetCapex || 0) + (project.budgetOpex || 0);
  };

  const getProjectTotalSpent = (project: Project) => {
    return (project.projectBlocks || []).reduce((sum, block) => sum + (block.actualCost || 0), 0);
  };

  const getProjectTotalAllocated = (project: Project) => {
    return (project.projectBlocks || []).reduce((sum, block) => 
      sum + (block.allocations || []).reduce((allocSum, alloc) => 
        allocSum + (alloc.allocatedHours * (alloc.resource.monthlyRate / 160)), 0), 0
    );
  };

  const getProjectVariance = (project: Project) => {
    const totalBudget = getProjectTotalBudget(project);
    const totalSpent = getProjectTotalSpent(project);
    return totalBudget - totalSpent;
  };

  const getProjectVariancePercentage = (project: Project) => {
    const totalBudget = getProjectTotalBudget(project);
    const variance = getProjectVariance(project);
    return totalBudget > 0 ? ((variance / totalBudget) * 100) : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = filteredProjects.map(project => ({
    name: project.code,
    budget: getProjectTotalBudget(project),
    spent: getProjectTotalSpent(project),
    allocated: getProjectTotalAllocated(project),
    variance: getProjectVariance(project)
  }));

  const budgetTypeData = [
    { name: 'CAPEX', value: projects.reduce((sum, p) => sum + (p.budgetCapex || 0), 0) },
    { name: 'OPEX', value: projects.reduce((sum, p) => sum + (p.budgetOpex || 0), 0) }
  ];

  const projectTypeData = projects.reduce((acc, project) => {
    const type = project.projectType.name;
    const budget = getProjectTotalBudget(project);
    const existing = acc.find(item => item.name === type);
    
    if (existing) {
      existing.value += budget;
    } else {
      acc.push({ name: type, value: budget });
    }
    
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget data...</p>
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
              <DollarSign className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Budget & Cost Tracking</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(budgetSummary.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(budgetSummary.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {budgetSummary.totalBudget > 0 
                  ? `${((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget`
                  : 'No budget data'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(budgetSummary.remainingBudget)}</div>
              <p className="text-xs text-muted-foreground">
                Available for allocation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
              {budgetSummary.variance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${budgetSummary.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {budgetSummary.variance >= 0 ? '+' : ''}{budgetSummary.variancePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(Math.abs(budgetSummary.variance))} {budgetSummary.variance >= 0 ? 'under' : 'over'} budget
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                <Select value={typeFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="R&D_HUB">R&D Hub</option>
                  <option value="R&D_SERVICE">R&D Service</option>
                  <option value="CORE_PRODUCT">Core Product</option>
                  <option value="CUSTOM_APP">Custom App</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Spending by Project</CardTitle>
              <CardDescription>Comparison of allocated budget and actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                  <Bar dataKey="allocated" fill="#ffc658" name="Allocated" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Distribution by Type</CardTitle>
              <CardDescription>CAPEX vs OPEX budget allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={budgetTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Project Budget Table */}
        <Card>
          <CardHeader>
            <CardTitle>Project Budget Details</CardTitle>
            <CardDescription>Detailed budget and cost analysis for each project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        No projects found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const totalBudget = getProjectTotalBudget(project);
                      const totalSpent = getProjectTotalSpent(project);
                      const totalAllocated = getProjectTotalAllocated(project);
                      const variance = getProjectVariance(project);
                      const variancePercentage = getProjectVariancePercentage(project);

                      return (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                <div className="text-sm text-gray-500">{project.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">{project.projectType.name}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(totalBudget)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(totalSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(totalAllocated)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(Math.abs(variance))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}