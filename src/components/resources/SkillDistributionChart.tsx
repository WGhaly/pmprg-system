'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillData {
  skillName: string;
  resourceCount: number;
  totalCapacity: number;
  totalAllocated: number;
  utilization: number;
}

interface SkillDistributionChartProps {
  data: SkillData[];
}

export default function SkillDistributionChart({ data }: SkillDistributionChartProps) {
  // Sort data by resource count descending
  const sortedData = [...data].sort((a, b) => b.resourceCount - a.resourceCount);

  // Take top 10 skills to avoid overcrowding
  const chartData = sortedData.slice(0, 10).map((skill) => ({
    skill: skill.skillName.length > 15 ? skill.skillName.substring(0, 15) + '...' : skill.skillName,
    fullName: skill.skillName,
    resourceCount: skill.resourceCount,
    capacity: skill.totalCapacity,
    allocated: skill.totalAllocated,
    utilization: Math.round(skill.utilization),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullName}</p>
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

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No skill distribution data available</p>
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
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="skill" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Resources', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="resourceCount" 
            name="Resource Count"
            fill="#3b82f6" 
            stroke="#2563eb"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}