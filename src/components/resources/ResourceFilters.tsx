'use client';

import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';

interface Skill {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface Filters {
  search: string;
  team: string;
  employmentType: string;
  skillId: string;
  activeOnly: boolean;
}

interface ResourceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClose: () => void;
}

export default function ResourceFilters({ filters, onFiltersChange, onClose }: ResourceFiltersProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const employmentTypes = [
    { value: '', label: 'All Types' },
    { value: 'FTE', label: 'Full-Time Employee' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Consultant', label: 'Consultant' },
    { value: 'Intern', label: 'Intern' },
  ];

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        
        // Load skills
        const skillsResponse = await fetch('/api/skills');
        if (skillsResponse.ok) {
          const skills = await skillsResponse.json();
          setAvailableSkills(skills);
        }

        // Load teams from resources (could be optimized with a dedicated endpoint)
        const resourcesResponse = await fetch('/api/resources?activeOnly=false');
        if (resourcesResponse.ok) {
          const resources = await resourcesResponse.json();
          const teams = [...new Set(resources.map((r: any) => r.homeTeam))].sort() as string[];
          setAvailableTeams(teams);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle filter changes
  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      team: '',
      employmentType: '',
      skillId: '',
      activeOnly: true,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.team || filters.employmentType || filters.skillId || !filters.activeOnly;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Team Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              value={filters.team}
              onChange={(e) => updateFilter('team', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teams</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Type
            </label>
            <select
              value={filters.employmentType}
              onChange={(e) => updateFilter('employmentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <select
              value={filters.skillId}
              onChange={(e) => updateFilter('skillId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Skills</option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.activeOnly.toString()}
              onChange={(e) => updateFilter('activeOnly', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Active Only</option>
              <option value="false">All (Active & Inactive)</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.team && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Team: {filters.team}
                <button
                  onClick={() => updateFilter('team', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.employmentType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Type: {filters.employmentType}
                <button
                  onClick={() => updateFilter('employmentType', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.skillId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Skill: {availableSkills.find(s => s.id === filters.skillId)?.name || 'Unknown'}
                <button
                  onClick={() => updateFilter('skillId', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {!filters.activeOnly && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Including Inactive
                <button
                  onClick={() => updateFilter('activeOnly', true)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}