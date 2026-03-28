import React from 'react';
import { CulturalEvent } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StatsProps {
  events: CulturalEvent[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];

export const Stats: React.FC<StatsProps> = ({ events }) => {
  
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  const dateData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.date] = (counts[e.date] || 0) + 1;
    });
    // Sort by date
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 7) // Take first 7 days for readability
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Eventos por Categoría</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Actividad Próxima (7 días)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dateData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
