'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Clock, DollarSign, AlertTriangle, BarChart3, PieChart, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import UtilizationChart from '@/components/resources/UtilizationChart';
import TeamCapacityChart from '@/components/resources/TeamCapacityChart';
import SkillDistributionChart from '@/components/resources/SkillDistributionChart';
import ResourceAllocationTable from '@/components/resources/ResourceAllocationTable';

interface UtilizationData {
  dateRange: {
    startDate: string;
    endDate: string;
    totalWeeks: number;
  };
  summary: {
    totalResources: number;
    totalTeams: number;
    totalCapacityHours: number;
    totalAllocatedHours: number;
    totalAvailableHours: number;
    averageUtilization: number;
    isOverallocated: boolean;
  };
  weeklyCapacity: Array<{
    weekStartDate: string;
    weekEndDate: string;
    capacity: {
      total: number;
      allocated: number;
      available: number;
      utilization: number;
    };
    teams: Array<{
      teamName: string;
      capacity: number;
      allocated: number;
      available: number;
      utilization: number;
      resourceCount: number;
    }>;
    resourceCount: number;
  }>;
  teams: Array<{
    name: string;
    resourceCount: number;
    totalCapacity: number;
    totalAllocated: number;
    totalAvailable: number;
    utilization: number;
  }>;
}

interface ResourceAvailability {
  resources: Array<{
    resource: {
      id: string;
      name: string;
      employeeCode: string;
      homeTeam: string;
      capacityHoursPerWeek: number;
    };
    allocation: {
      totalCapacityHours: number;
      totalAllocatedHours: number;
      totalAvailableHours: number;
      utilizationPercentage: number;
      isOverallocated: boolean;
      isAvailable: boolean;
    };
  }>;
  summary: {
    totalResources: number;
    totalCapacityHours: number;
    totalAllocatedHours: number;
    totalAvailableHours: number;
    averageUtilization: number;
    availableResources: number;
    overallocatedResources: number;
  };
}

export default function ResourceUtilizationDashboard() {
  const [utilizationData, setUtilizationData] = useState<UtilizationData | null>(null);
  const [resourceAvailability, setResourceAvailability] = useState<ResourceAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 weeks from now
  });
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  // Fetch utilization data
  const fetchUtilizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch capacity planning data
      const capacityParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedTeam && { team: selectedTeam }),
        ...(selectedSkill && { skillId: selectedSkill }),
      });

      const capacityResponse = await fetch(`/api/resources/capacity?${capacityParams}`);
      if (!capacityResponse.ok) throw new Error('Failed to fetch capacity data');
      const capacityData = await capacityResponse.json();
      setUtilizationData(capacityData);

      // Fetch resource availability data
      const resourcesResponse = await fetch('/api/resources?includeSkills=true&activeOnly=true');
      if (!resourcesResponse.ok) throw new Error('Failed to fetch resources');
      const resources = await resourcesResponse.json();
      
      const resourceIds = resources.map((r: any) => r.id);
      
      const availabilityResponse = await fetch('/api/resources/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceIds,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          ...(selectedSkill && { skillFilters: [selectedSkill] }),
        }),
      });
      
      if (!availabilityResponse.ok) throw new Error('Failed to fetch availability data');
      const availabilityData = await availabilityResponse.json();
      setResourceAvailability(availabilityData);

    } catch (error) {
      console.error('Error fetching utilization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchUtilizationData();
  }, [dateRange.startDate, dateRange.endDate, selectedTeam, selectedSkill]);

  // Calculate key metrics
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (utilization >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (utilization >= 50) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getAvailabilityInsights = () => {
    if (!resourceAvailability) return [];
    
    const insights = [];
    
    if (resourceAvailability.summary.overallocatedResources > 0) {
      insights.push({
        type: 'warning',
        title: 'Over-allocated Resources',
        message: `${resourceAvailability.summary.overallocatedResources} resources are over-allocated`,
        icon: AlertTriangle,
      });
    }
    
    if (resourceAvailability.summary.availableResources > 0) {
      insights.push({
        type: 'info',
        title: 'Available Capacity',
        message: `${resourceAvailability.summary.availableResources} resources have available capacity`,
        icon: Users,
      });
    }
    
    if (resourceAvailability.summary.averageUtilization < 60) {
      insights.push({
        type: 'info',
        title: 'Low Utilization',
        message: `Average utilization is ${resourceAvailability.summary.averageUtilization}% - consider more projects`,
        icon: TrendingUp,
      });
    }
    
    return insights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading utilization dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                  <Home className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Home</span>
                </Link>
                <span className="text-gray-400">/</span>
                <Link
                  href="/resources"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <span>Resources</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-900">Dashboard</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resource Utilization Dashboard</h1>
                <p className="text-gray-600 mt-1">Monitor resource allocation, capacity, and performance metrics</p>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics Cards */}
        {utilizationData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-gray-900">{utilizationData.summary.totalResources}</p>
                  <p className="text-xs text-gray-500">{utilizationData.summary.totalTeams} teams</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{utilizationData.summary.totalCapacityHours.toLocaleString()}h</p>
                  <p className="text-xs text-gray-500">{utilizationData.dateRange.totalWeeks} weeks</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                  <p className={`text-2xl font-bold ${utilizationData.summary.averageUtilization > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                    {utilizationData.summary.averageUtilization}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {utilizationData.summary.isOverallocated ? 'Over-allocated' : 'Within capacity'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{utilizationData.summary.totalAvailableHours.toLocaleString()}h</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((utilizationData.summary.totalAvailableHours / utilizationData.summary.totalCapacityHours) * 100)}% free
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights and Alerts */}
        {resourceAvailability && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insights & Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getAvailabilityInsights().map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className={`p-4 rounded-lg border ${
                    insight.type === 'warning' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        insight.type === 'warning' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                      <div className="ml-3">
                        <h4 className={`text-sm font-medium ${
                          insight.type === 'warning' ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className={`text-sm ${
                          insight.type === 'warning' ? 'text-red-700' : 'text-blue-700'
                        }`}>
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Utilization Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Weekly Utilization Trend</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            {utilizationData && (
              <UtilizationChart data={utilizationData.weeklyCapacity} />
            )}
          </div>

          {/* Team Capacity Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Team Capacity Distribution</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            {utilizationData && (
              <TeamCapacityChart data={utilizationData.teams} />
            )}
          </div>
        </div>

        {/* Team Performance Table */}
        {utilizationData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance Overview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {utilizationData.teams.map((team) => (
                    <tr key={team.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {team.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.resourceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.totalCapacity.toLocaleString()}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.totalAllocated.toLocaleString()}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.totalAvailable.toLocaleString()}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUtilizationColor(team.utilization)}`}>
                          {team.utilization}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resource Allocation Details */}
        {resourceAvailability && (
          <ResourceAllocationTable data={resourceAvailability.resources} />
        )}
      </div>
    </div>
  );
}