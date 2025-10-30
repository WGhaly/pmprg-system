'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';

interface WeeklyCapacityData {
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
}

interface UtilizationChartProps {
  data: WeeklyCapacityData[];
}

export default function UtilizationChart({ data }: UtilizationChartProps) {
  // Transform data for chart
  const chartData = data.map((week) => ({
    week: new Date(week.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: week.weekStartDate,
    capacity: week.capacity.total,
    allocated: week.capacity.allocated,
    available: week.capacity.available,
    utilization: Math.round(week.capacity.utilization),
    resourceCount: week.resourceCount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">Week of {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Capacity:</span>
              <span className="font-medium text-blue-600">{data.capacity.toLocaleString()}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Allocated:</span>
              <span className="font-medium text-purple-600">{data.allocated.toLocaleString()}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available:</span>
              <span className="font-medium text-green-600">{data.available.toLocaleString()}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Utilization:</span>
              <span className={`font-medium ${data.utilization > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                {data.utilization}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Resources:</span>
              <span className="font-medium text-gray-900">{data.resourceCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No utilization data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="capacity" 
            name="Total Capacity"
            fill="#e5e7eb" 
            stroke="#9ca3af"
            strokeWidth={1}
          />
          <Bar 
            dataKey="allocated" 
            name="Allocated"
            fill="#8b5cf6" 
            stroke="#7c3aed"
            strokeWidth={1}
          />
          <Bar 
            dataKey="available" 
            name="Available"
            fill="#10b981" 
            stroke="#059669"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}