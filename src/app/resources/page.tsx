'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Calendar, TrendingUp, BarChart3, Home } from 'lucide-react';
import Link from 'next/link';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceForm from '@/components/resources/ResourceForm';
import ResourceFilters from '@/components/resources/ResourceFilters';
import CapacityOverview from '@/components/resources/CapacityOverview';

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

interface Filters {
  search: string;
  team: string;
  employmentType: string;
  skillId: string;
  activeOnly: boolean;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    team: '',
    employmentType: '',
    skillId: '',
    activeOnly: true,
  });

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        includeSkills: 'true',
        ...(filters.team && { team: filters.team }),
        ...(filters.employmentType && { employmentType: filters.employmentType }),
        activeOnly: filters.activeOnly.toString(),
      });

      const response = await fetch(`/api/resources?${params}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...resources];

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm) ||
        resource.employeeCode.toLowerCase().includes(searchTerm) ||
        resource.homeTeam.toLowerCase().includes(searchTerm) ||
        (resource.skills && resource.skills.some(skill => 
          skill.skillName.toLowerCase().includes(searchTerm) ||
          skill.skillCode.toLowerCase().includes(searchTerm)
        ))
      );
    }

    // Skill filter
    if (filters.skillId) {
      filtered = filtered.filter(resource =>
        resource.skills && resource.skills.some(skill => skill.skillId === filters.skillId)
      );
    }

    setFilteredResources(filtered);
  }, [resources, filters]);

  // Load resources on component mount
  useEffect(() => {
    fetchResources();
  }, [filters.team, filters.employmentType, filters.activeOnly]);

  // Handle form submission
  const handleResourceSaved = () => {
    setShowForm(false);
    setEditingResource(null);
    fetchResources();
  };

  // Handle resource edit
  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  // Handle resource delete/deactivate
  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to deactivate this resource?')) return;

    try {
      const response = await fetch(`/api/resources?id=${resourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete resource');
      
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  // Calculate summary metrics
  const totalResources = filteredResources.length;
  const totalCapacity = filteredResources.reduce((sum, r) => sum + r.capacityHoursPerWeek, 0);
  const uniqueTeams = [...new Set(filteredResources.map(r => r.homeTeam))].length;
  const averageHourlyRate = filteredResources.length > 0
    ? Math.round(filteredResources.reduce((sum, r) => sum + r.derivedMetrics.hourlyRate, 0) / filteredResources.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                  <Home className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Home</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="ml-2 text-sm font-medium text-gray-900">Resources</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
              <p className="text-gray-600 mt-1">Manage team members, skills, and capacity</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/resources/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Utilization Dashboard
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Resources</p>
                  <p className="text-2xl font-bold text-blue-900">{totalResources}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Weekly Capacity</p>
                  <p className="text-2xl font-bold text-green-900">{totalCapacity}h</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Teams</p>
                  <p className="text-2xl font-bold text-purple-900">{uniqueTeams}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Avg. Hourly Rate</p>
                  <p className="text-2xl font-bold text-orange-900">${averageHourlyRate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources by name, code, team, or skills..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <ResourceFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Capacity Overview */}
        <CapacityOverview resources={filteredResources} />

        {/* Resources Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.team || filters.employmentType || filters.skillId
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first resource.'}
            </p>
            {!filters.search && !filters.team && !filters.employmentType && !filters.skillId && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEditResource}
                onDelete={handleDeleteResource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resource Form Modal */}
      {showForm && (
        <ResourceForm
          resource={editingResource}
          onSave={handleResourceSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingResource(null);
          }}
        />
      )}
    </div>
  );
}