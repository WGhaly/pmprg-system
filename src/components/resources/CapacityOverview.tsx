'use client';

import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  employeeCode: string;
  homeTeam: string;
  employmentType: string;
  monthlyRate: number;
  capacityHoursPerWeek: number;
  derivedMetrics: {
    hourlyRate: number;
    weeklyCapacity: number;
    annualCapacity: number;
  };
  skills?: Array<{
    skillId: string;
    skillCode: string;
    skillName: string;
    skillCategory: string;
    level: number;
  }>;
}

interface CapacityOverviewProps {
  resources: Resource[];
}

export default function CapacityOverview({ resources }: CapacityOverviewProps) {
  // Calculate metrics
  const totalResources = resources.length;
  const totalWeeklyCapacity = resources.reduce((sum, r) => sum + r.capacityHoursPerWeek, 0);
  const totalAnnualCapacity = resources.reduce((sum, r) => sum + r.derivedMetrics.annualCapacity, 0);
  
  // Calculate team breakdown
  const teamBreakdown = resources.reduce((acc, resource) => {
    const team = resource.homeTeam;
    if (!acc[team]) {
      acc[team] = {
        name: team,
        count: 0,
        weeklyCapacity: 0,
        totalCost: 0,
        employmentTypes: {} as { [key: string]: number },
      };
    }
    
    acc[team].count += 1;
    acc[team].weeklyCapacity += resource.capacityHoursPerWeek;
    acc[team].totalCost += resource.monthlyRate;
    
    acc[team].employmentTypes[resource.employmentType] = 
      (acc[team].employmentTypes[resource.employmentType] || 0) + 1;
    
    return acc;
  }, {} as { [key: string]: any });

  const teams = Object.values(teamBreakdown);

  // Calculate employment type distribution
  const employmentTypeDistribution = resources.reduce((acc, resource) => {
    acc[resource.employmentType] = (acc[resource.employmentType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Calculate skill distribution
  const skillCounts = resources.reduce((acc, resource) => {
    if (resource.skills) {
      resource.skills.forEach(skill => {
        if (!acc[skill.skillCategory]) {
          acc[skill.skillCategory] = 0;
        }
        acc[skill.skillCategory] += 1;
      });
    }
    return acc;
  }, {} as { [key: string]: number });

  const topSkillCategories = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate capacity utilization insights
  const avgWeeklyCapacity = totalResources > 0 ? totalWeeklyCapacity / totalResources : 0;
  const avgMonthlyRate = totalResources > 0 
    ? resources.reduce((sum, r) => sum + r.monthlyRate, 0) / totalResources 
    : 0;
  const avgHourlyRate = totalResources > 0 
    ? resources.reduce((sum, r) => sum + r.derivedMetrics.hourlyRate, 0) / totalResources 
    : 0;

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'FTE': return 'bg-green-100 text-green-800 border-green-200';
      case 'Contractor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Consultant': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Intern': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (totalResources === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Resources to Analyze</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some resources to see capacity overview and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Capacity Overview</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">{totalResources}</p>
          <p className="text-sm text-blue-700">Total Resources</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">{totalWeeklyCapacity}h</p>
          <p className="text-sm text-green-700">Weekly Capacity</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-900">{Math.round(avgWeeklyCapacity)}h</p>
          <p className="text-sm text-purple-700">Avg per Resource</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-900">${Math.round(avgHourlyRate)}</p>
          <p className="text-sm text-orange-700">Avg Hourly Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Breakdown */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Team Breakdown</h4>
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{team.name}</h5>
                  <span className="text-sm text-gray-500">{team.count} resources</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Weekly Capacity:</span>
                    <span className="ml-2 font-medium">{team.weeklyCapacity}h</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Monthly Cost:</span>
                    <span className="ml-2 font-medium">${team.totalCost.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(team.employmentTypes).map(([type, count]) => (
                    <span
                      key={type}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getEmploymentTypeColor(type)}`}
                    >
                      {count as number} {type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employment Type & Skills Distribution */}
        <div className="space-y-6">
          {/* Employment Type Distribution */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Employment Types</h4>
            <div className="space-y-2">
              {Object.entries(employmentTypeDistribution).map(([type, count]) => {
                const percentage = Math.round((count / totalResources) * 100);
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getEmploymentTypeColor(type)}`}>
                        {type}
                      </span>
                      <span className="text-sm text-gray-700">{count} resources</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Skill Categories */}
          {topSkillCategories.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Top Skill Categories</h4>
              <div className="space-y-2">
                {topSkillCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-medium text-gray-900">{count} skills</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Financial Summary</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Monthly Cost:</span>
                <span className="font-medium">${(avgMonthlyRate * totalResources).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average Monthly Rate:</span>
                <span className="font-medium">${Math.round(avgMonthlyRate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average Hourly Rate:</span>
                <span className="font-medium">${Math.round(avgHourlyRate)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-600">Annual Capacity:</span>
                <span className="font-medium">{totalAnnualCapacity.toLocaleString()} hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}