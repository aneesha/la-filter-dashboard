import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FilterRequest, ColumnMeta } from '../api';
import { fetchAccessByWeek, fetchActivitiesByWeek, fetchAppliedByWeek, fetchSankey } from '../api';
import FilterPanel from '../components/FilterPanel';
import SankeyChart from '../components/SankeyChart';

interface Props {
  filters: FilterRequest;
  setFilters: (f: FilterRequest) => void;
  columns: ColumnMeta[];
}

export default function Dashboard({ filters, setFilters, columns }: Props) {
  const [accessData, setAccessData] = useState<Record<string, unknown>[]>([]);
  const [activitiesData, setActivitiesData] = useState<Record<string, unknown>[]>([]);
  const [appliedData, setAppliedData] = useState<Record<string, unknown>[]>([]);
  const [sankeyData, setSankeyData] = useState<{ nodes: { name: string }[]; links: { source: number; target: number; value: number }[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  const hasFilters = filters.groups.some(g => g.conditions.length > 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [access, activities, applied, sankey] = await Promise.all([
        fetchAccessByWeek(filters),
        fetchActivitiesByWeek(filters),
        fetchAppliedByWeek(filters),
        fetchSankey(filters),
      ]);
      setAccessData(access);
      setActivitiesData(activities);
      setAppliedData(applied);
      setSankeyData(sankey);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <FilterPanel filters={filters} setFilters={setFilters} columns={columns} />
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Overview Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Visual overview of student engagement and performance
        </p>
      </div>

      <FilterPanel filters={filters} setFilters={setFilters} columns={columns} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Access */}
        <ChartCard title="Weekly Course Access" subtitle="Unique students accessing the course each week">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={accessData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="all" name="All Students" fill="#818cf8" radius={[4, 4, 0, 0]} />
              {hasFilters && (
                <Bar dataKey="filtered" name="Filtered" fill="#f97316" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Weekly Activities Completion */}
        <ChartCard title="Weekly Activity Completion" subtitle="Students completing weekly activities">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activitiesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="all" name="All Students" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              {hasFilters && (
                <Bar dataKey="filtered" name="Filtered" fill="#f97316" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Applied Classes Completion */}
        <ChartCard title="Applied Class Completion" subtitle="Students completing applied classes each week">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appliedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="all" name="All Students" fill="#c084fc" radius={[4, 4, 0, 0]} />
              {hasFilters && (
                <Bar dataKey="filtered" name="Filtered" fill="#f97316" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sankey Diagram - full width */}
        <div className="lg:col-span-2">
        <ChartCard title="Grade Transitions" subtitle="How students transition between grade bands across Weekly Activities, Design Document, Web Project and Code Review">
          <SankeyChart
            nodes={sankeyData.nodes}
            links={sankeyData.links}
            height={500}
          />
        </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}
