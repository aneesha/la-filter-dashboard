import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterRequest, FilterCondition, ColumnMeta } from '../api';
import { emptyFilter } from '../api';

interface Props {
  filters: FilterRequest;
  setFilters: (f: FilterRequest) => void;
  columns: ColumnMeta[];
}

const OPERATORS: Record<string, { label: string; types: string[] }> = {
  eq: { label: 'equals', types: ['text', 'number', 'select'] },
  neq: { label: 'not equals', types: ['text', 'number', 'select'] },
  gt: { label: 'greater than', types: ['number'] },
  gte: { label: 'at least', types: ['number'] },
  lt: { label: 'less than', types: ['number'] },
  lte: { label: 'at most', types: ['number'] },
  contains: { label: 'contains', types: ['text'] },
  empty: { label: 'is empty', types: ['text', 'number', 'select'] },
  not_empty: { label: 'is not empty', types: ['text', 'number', 'select'] },
};

function formatFieldName(field: string): string {
  return field
    .replace(/^(grade_|access_|applied_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function FilterPanel({ filters, setFilters, columns }: Props) {
  const [expanded, setExpanded] = useState(true);

  const categories = [...new Set(columns.map(c => c.category))];

  const hasFilters = filters.groups.some(g => g.conditions.length > 0);

  const addGroup = () => {
    setFilters({
      ...filters,
      groups: [...filters.groups, { logic: 'AND', conditions: [{ field: columns[0]?.field || '', operator: 'eq', value: '' }] }],
    });
  };

  const removeGroup = (gi: number) => {
    const groups = filters.groups.filter((_, i) => i !== gi);
    setFilters({ ...filters, groups });
  };

  const updateGroupLogic = (gi: number, logic: 'AND' | 'OR') => {
    const groups = [...filters.groups];
    groups[gi] = { ...groups[gi], logic };
    setFilters({ ...filters, groups });
  };

  const addCondition = (gi: number) => {
    const groups = [...filters.groups];
    groups[gi] = {
      ...groups[gi],
      conditions: [...groups[gi].conditions, { field: columns[0]?.field || '', operator: 'eq', value: '' }],
    };
    setFilters({ ...filters, groups });
  };

  const removeCondition = (gi: number, ci: number) => {
    const groups = [...filters.groups];
    const conditions = groups[gi].conditions.filter((_, i) => i !== ci);
    if (conditions.length === 0) {
      removeGroup(gi);
    } else {
      groups[gi] = { ...groups[gi], conditions };
      setFilters({ ...filters, groups });
    }
  };

  const updateCondition = (gi: number, ci: number, updates: Partial<FilterCondition>) => {
    const groups = [...filters.groups];
    const conditions = [...groups[gi].conditions];
    conditions[ci] = { ...conditions[ci], ...updates };

    // Reset value when changing field or operator
    if (updates.field) {
      conditions[ci].operator = 'eq';
      conditions[ci].value = '';
    }

    groups[gi] = { ...groups[gi], conditions };
    setFilters({ ...filters, groups });
  };

  const reset = () => setFilters(emptyFilter);

  const getOperatorsForField = (field: string) => {
    const col = columns.find(c => c.field === field);
    const type = col?.type || 'text';
    return Object.entries(OPERATORS).filter(([, v]) => v.types.includes(type));
  };

  const needsValue = (op: string) => !['empty', 'not_empty'].includes(op);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-600" />
          <span className="font-semibold text-sm text-slate-900">Filters</span>
          {hasFilters && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100">
          {filters.groups.length > 1 && (
            <div className="flex items-center gap-2 mt-3 mb-2">
              <span className="text-xs text-slate-500 font-medium">Between groups:</span>
              <select
                value={filters.logic}
                onChange={e => setFilters({ ...filters, logic: e.target.value as 'AND' | 'OR' })}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white font-medium"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {filters.groups.map((group, gi) => (
            <div key={gi} className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Group {gi + 1}
                  </span>
                  {group.conditions.length > 1 && (
                    <select
                      value={group.logic}
                      onChange={e => updateGroupLogic(gi, e.target.value as 'AND' | 'OR')}
                      className="text-xs border border-slate-200 rounded px-2 py-0.5 bg-white font-medium"
                    >
                      <option value="AND">Match ALL</option>
                      <option value="OR">Match ANY</option>
                    </select>
                  )}
                </div>
                <button onClick={() => removeGroup(gi)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              {group.conditions.map((cond, ci) => {
                const col = columns.find(c => c.field === cond.field);
                return (
                  <div key={ci} className="flex items-center gap-2 mb-2 flex-wrap">
                    <select
                      value={cond.field}
                      onChange={e => updateCondition(gi, ci, { field: e.target.value })}
                      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[180px]"
                    >
                      {categories.map(cat => (
                        <optgroup key={cat} label={cat}>
                          {columns.filter(c => c.category === cat).map(c => (
                            <option key={c.field} value={c.field}>
                              {formatFieldName(c.field)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    <select
                      value={cond.operator}
                      onChange={e => updateCondition(gi, ci, { operator: e.target.value })}
                      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                    >
                      {getOperatorsForField(cond.field).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>

                    {needsValue(cond.operator) && (
                      col?.type === 'select' ? (
                        <select
                          value={cond.value ?? ''}
                          onChange={e => updateCondition(gi, ci, { value: e.target.value })}
                          className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[150px]"
                        >
                          <option value="">Select...</option>
                          {col.options?.map(opt => (
                            <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col?.type === 'number' ? 'number' : 'text'}
                          value={cond.value ?? ''}
                          onChange={e => updateCondition(gi, ci, { value: col?.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
                          placeholder="Value..."
                          className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[120px]"
                        />
                      )
                    )}

                    <button
                      onClick={() => removeCondition(gi, ci)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => addCondition(gi)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-1"
              >
                <Plus size={12} /> Add condition
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={addGroup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} /> Add Filter Group
            </button>
            {hasFilters && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
