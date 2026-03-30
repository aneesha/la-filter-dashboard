import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Student } from '../api';

interface Props {
  students: Student[];
  selectedUsernames: Set<string>;
  onToggleSelect: (username: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

type SortDir = 'asc' | 'desc' | null;

const DISPLAY_COLS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'username', label: 'Username' },
  { key: 'degree_program', label: 'Program' },
  { key: 'email', label: 'Email' },
  { key: 'Design Document', label: 'Design Doc' },
  { key: 'Web Project', label: 'Web Project' },
  { key: 'Code Review', label: 'Code Review' },
];

export default function StudentTable({ students, selectedUsernames, onToggleSelect, onSelectAll, onDeselectAll }: Props) {
  const [sortKey, setSortKey] = useState<string>('last_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return students;
    return [...students].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [students, sortKey, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(students.length / pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey('');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const allSelected = students.length > 0 && students.every(s => selectedUsernames.has(s.username));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {DISPLAY_COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-3 py-3 text-left font-semibold text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <ChevronsUpDown size={14} className="text-slate-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(student => (
              <tr
                key={student.username}
                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedUsernames.has(student.username) ? 'bg-indigo-50' : ''
                }`}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedUsernames.has(student.username)}
                    onChange={() => onToggleSelect(student.username)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                {DISPLAY_COLS.map(col => (
                  <td key={col.key} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                    {student[col.key] != null ? String(student[col.key]) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={DISPLAY_COLS.length + 1} className="px-3 py-8 text-center text-slate-400">
                  No students match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
        <span className="text-sm text-slate-500">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, students.length)} of {students.length}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-sm rounded-md border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-sm rounded-md border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
