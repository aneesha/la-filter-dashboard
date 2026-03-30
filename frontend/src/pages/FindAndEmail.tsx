import { useState, useEffect, useCallback } from 'react';
import { Mail, Users } from 'lucide-react';
import type { FilterRequest, ColumnMeta, Student } from '../api';
import { filterStudents } from '../api';
import FilterPanel from '../components/FilterPanel';
import StudentTable from '../components/StudentTable';
import EmailComposer from '../components/EmailComposer';

interface Props {
  filters: FilterRequest;
  setFilters: (f: FilterRequest) => void;
  columns: ColumnMeta[];
}

export default function FindAndEmail({ filters, setFilters, columns }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await filterStudents(filters);
      setStudents(result.students);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const toggleSelect = (username: string) => {
    const next = new Set(selectedUsernames);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setSelectedUsernames(next);
  };

  const selectAll = () => {
    setSelectedUsernames(new Set(students.map(s => s.username)));
  };

  const deselectAll = () => {
    setSelectedUsernames(new Set());
  };

  const selectedStudents = students.filter(s => selectedUsernames.has(s.username));
  const hasFilters = filters.groups.some(g => g.conditions.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Find & Email Students</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Filter students and send targeted communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} />
            <span>
              {hasFilters ? `${students.length} of ${total}` : `${total}`} students
            </span>
          </div>
          {selectedUsernames.size > 0 && (
            <button
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Mail size={16} />
              Email {selectedUsernames.size} Student{selectedUsernames.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <FilterPanel filters={filters} setFilters={setFilters} columns={columns} />

      {showComposer && selectedStudents.length > 0 && (
        <EmailComposer
          selectedStudents={selectedStudents}
          onClose={() => setShowComposer(false)}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Loading students...</p>
        </div>
      ) : (
        <StudentTable
          students={students}
          selectedUsernames={selectedUsernames}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />
      )}
    </div>
  );
}
