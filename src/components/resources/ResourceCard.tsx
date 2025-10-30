'use client';

import { useState } from 'react';
import { Edit, Trash2, User, Calendar, DollarSign, Clock, Badge, MapPin } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  employeeCode: string;
  homeTeam: string;
  employmentType: string;
  monthlyRate: number;
  capacityHoursPerWeek: number;
  availabilityCalendar?: string;
  active: boolean;
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

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string) => void;
}

export default function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'FTE':
        return 'bg-green-100 text-green-800';
      case 'Contractor':
        return 'bg-blue-100 text-blue-800';
      case 'Consultant':
        return 'bg-purple-100 text-purple-800';
      case 'Intern':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillLevelColor = (level: number) => {
    if (level >= 8) return 'bg-green-100 text-green-800';
    if (level >= 6) return 'bg-blue-100 text-blue-800';
    if (level >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSkillLevelText = (level: number) => {
    if (level >= 8) return 'Expert';
    if (level >= 6) return 'Advanced';
    if (level >= 4) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{resource.name}</h3>
              <p className="text-sm text-gray-500">{resource.employeeCode}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(resource)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit resource"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(resource.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Deactivate resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Employment Type and Team */}
        <div className="mt-3 flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmploymentTypeColor(resource.employmentType)}`}>
            {resource.employmentType}
          </span>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {resource.homeTeam}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-green-600 mb-1">
              <DollarSign className="w-4 h-4 mr-1" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${resource.derivedMetrics.hourlyRate}</p>
            <p className="text-xs text-gray-500">Hourly Rate</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Clock className="w-4 h-4 mr-1" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{resource.capacityHoursPerWeek}h</p>
            <p className="text-xs text-gray-500">Weekly Capacity</p>
          </div>
        </div>

        {/* Skills Preview */}
        {resource.skills && resource.skills.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Skills</h4>
              <span className="text-xs text-gray-500">{resource.skills.length} total</span>
            </div>
            
            <div className="space-y-2">
              {resource.skills.slice(0, showDetails ? resource.skills.length : 3).map((skill) => (
                <div key={skill.skillId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-700">{skill.skillName}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)}`}>
                    {getSkillLevelText(skill.level)} ({skill.level}/10)
                  </span>
                </div>
              ))}
              
              {resource.skills.length > 3 && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showDetails ? 'Show less' : `Show ${resource.skills.length - 3} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Monthly Rate:</span>
              <span className="ml-2 font-medium">${resource.monthlyRate.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Annual Capacity:</span>
              <span className="ml-2 font-medium">{resource.derivedMetrics.annualCapacity}h</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${resource.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {resource.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {resource.availabilityCalendar && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Has Calendar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}