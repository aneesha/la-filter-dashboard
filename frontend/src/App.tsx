import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Users, BarChart3, GraduationCap } from 'lucide-react';
import type { FilterRequest, ColumnMeta } from './api';
import { fetchColumns, fetchCourse, emptyFilter } from './api';
import FindAndEmail from './pages/FindAndEmail';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [filters, setFilters] = useState<FilterRequest>(emptyFilter);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [course, setCourse] = useState<{ course_name: string; course_code: string } | null>(null);

  useEffect(() => {
    fetchColumns().then(setColumns);
    fetchCourse().then(setCourse);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                LA Dashboard
              </h1>
              {course && (
                <p className="text-xs text-slate-500">
                  {course.course_name} ({course.course_code})
                </p>
              )}
            </div>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Users size={16} />
              Find & Email
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <BarChart3 size={16} />
              Overview Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <Routes>
          <Route
            path="/"
            element={<FindAndEmail filters={filters} setFilters={setFilters} columns={columns} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard filters={filters} setFilters={setFilters} columns={columns} />}
          />
        </Routes>
      </main>
    </div>
  );
}
