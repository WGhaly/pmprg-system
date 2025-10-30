'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TeamCapacityData {
  name: string;
  resourceCount: number;
  totalCapacity: number;
  totalAllocated: number;
  totalAvailable: number;
  utilization: number;
}

interface TeamCapacityChartProps {
  data: TeamCapacityData[];
}

// Color palette for teams
const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#6b7280', // gray
  '#8b5a2b', // brown
  '#db2777', // pink
  '#0891b2', // cyan
  '#7c3aed', // violet
];

export default function TeamCapacityChart({ data }: TeamCapacityChartProps) {
  // Transform data for pie chart
  const chartData = data.map((team, index) => ({
    name: team.name,
    capacity: team.totalCapacity,
    allocated: team.totalAllocated,
    available: team.totalAvailable,
    utilization: Math.round(team.utilization),
    resourceCount: team.resourceCount,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Resources:</span>
              <span className="font-medium text-gray-900">{data.resourceCount}</span>
            </div>
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
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if segment is large enough (>5%)
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 font-medium">{entry.value}</span>
            <span className="text-gray-500 ml-1">
              ({chartData.find(d => d.name === entry.value)?.resourceCount} resources)
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No team capacity data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="capacity"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}