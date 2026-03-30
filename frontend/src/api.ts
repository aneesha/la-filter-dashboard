import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface FilterCondition {
  field: string;
  operator: string;
  value?: string | number | null;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface FilterRequest {
  groups: FilterGroup[];
  logic: 'AND' | 'OR';
}

export interface Student {
  username: string;
  first_name: string;
  last_name: string;
  degree_program: string;
  email: string;
  [key: string]: string | number | null | undefined;
}

export interface ColumnMeta {
  field: string;
  type: 'text' | 'number' | 'select';
  category: string;
  options?: (string | number)[];
  min?: number;
  max?: number;
}

export const fetchStudents = () => api.get<Student[]>('/students').then(r => r.data);

export const filterStudents = (filters: FilterRequest) =>
  api.post<{ students: Student[]; count: number; total: number }>('/students/filter', filters).then(r => r.data);

export const fetchColumns = () => api.get<ColumnMeta[]>('/columns').then(r => r.data);

export const fetchCourse = () => api.get('/course').then(r => r.data);

export const sendEmail = (to: string[], subject: string, body: string) =>
  api.post('/email/send', { to, subject, body }).then(r => r.data);

export const generateEmail = (description: string, context: string) =>
  api.post('/email/generate', { description, context }).then(r => r.data);

export const fetchAccessByWeek = (filters: FilterRequest) =>
  api.post('/dashboard/access-by-week', filters).then(r => r.data);

export const fetchActivitiesByWeek = (filters: FilterRequest) =>
  api.post('/dashboard/activities-by-week', filters).then(r => r.data);

export const fetchAppliedByWeek = (filters: FilterRequest) =>
  api.post('/dashboard/applied-by-week', filters).then(r => r.data);

export const fetchSankey = (filters: FilterRequest) =>
  api.post('/dashboard/sankey', filters).then(r => r.data);

export const emptyFilter: FilterRequest = { groups: [], logic: 'AND' };
