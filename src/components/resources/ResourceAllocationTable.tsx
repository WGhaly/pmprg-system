'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ResourceAllocationData {
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
}

interface ResourceAllocationTableProps {
  data: ResourceAllocationData[];
}

export default function ResourceAllocationTable({ data }: ResourceAllocationTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'utilization' | 'available'>('utilization');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'overallocated' | 'available' | 'fullyUtilized'>('all');

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortBy) {
      case 'name':
        aValue = a.resource.name;
        bValue = b.resource.name;
        break;
      case 'team':
        aValue = a.resource.homeTeam;
        bValue = b.resource.homeTeam;
        break;
      case 'utilization':
        aValue = a.allocation.utilizationPercentage;
        bValue = b.allocation.utilizationPercentage;
        break;
      case 'available':
        aValue = a.allocation.totalAvailableHours;
        bValue = b.allocation.totalAvailableHours;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  // Filter data
  const filteredData = sortedData.filter((item) => {
    switch (filterBy) {
      case 'overallocated':
        return item.allocation.isOverallocated;
      case 'available':
        return item.allocation.isAvailable && item.allocation.totalAvailableHours > 0;
      case 'fullyUtilized':
        return item.allocation.utilizationPercentage >= 90 && item.allocation.utilizationPercentage <= 100;
      default:
        return true;
    }
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getUtilizationColor = (utilization: number, isOverallocated: boolean) => {
    if (isOverallocated) return 'text-red-600 bg-red-50 border-red-200';
    if (utilization >= 90) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (utilization >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (utilization >= 50) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusIcon = (allocation: ResourceAllocationData['allocation']) => {
    if (allocation.isOverallocated) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (allocation.isAvailable && allocation.totalAvailableHours > 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (allocation.utilizationPercentage >= 90) {
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    }
    return <User className="h-4 w-4 text-gray-400" />;
  };

  const SortButton = ({ column, children }: { column: typeof sortBy; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left hover:text-gray-900 focus:outline-none"
    >
      <span>{children}</span>
      {sortBy === column && (
        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Allocation Details</h3>
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No resource allocation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Resource Allocation Details</h3>
        
        {/* Filter Controls */}
        <div className="flex items-center space-x-4">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Resources ({data.length})</option>
            <option value="overallocated">
              Over-allocated ({data.filter(r => r.allocation.isOverallocated).length})
            </option>
            <option value="available">
              Available ({data.filter(r => r.allocation.isAvailable && r.allocation.totalAvailableHours > 0).length})
            </option>
            <option value="fullyUtilized">
              Fully Utilized ({data.filter(r => r.allocation.utilizationPercentage >= 90 && r.allocation.utilizationPercentage <= 100).length})
            </option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="name">Resource</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="team">Team</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weekly Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allocated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="available">Available</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton column="utilization">Utilization</SortButton>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.resource.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    {getStatusIcon(item.allocation)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.resource.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.resource.employeeCode}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.resource.homeTeam}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.resource.capacityHoursPerWeek}h/week
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.allocation.totalCapacityHours.toLocaleString()}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.allocation.totalAllocatedHours.toLocaleString()}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {item.allocation.totalAvailableHours.toLocaleString()}h
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUtilizationColor(item.allocation.utilizationPercentage, item.allocation.isOverallocated)}`}>
                    {item.allocation.utilizationPercentage}%
                  </span>
                  {item.allocation.isOverallocated && (
                    <div className="mt-1 text-xs text-red-600">Over-allocated</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No resources match the selected filter criteria</p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredData.length} of {data.length} resources
        </div>
      )}
    </div>
  );
}