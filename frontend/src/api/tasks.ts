import { api } from './axios';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; role: string };
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export const tasksApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: TasksResponse }>('/tasks', { params }),

  getById: (id: string) => api.get<{ data: Task }>(`/tasks/${id}`),

  getStats: () => api.get<{ data: TaskStats }>('/tasks/stats'),

  create: (data: { title: string; description?: string; status?: TaskStatus }) =>
    api.post<{ data: Task }>('/tasks', data),

  update: (id: string, data: { title?: string; description?: string; status?: TaskStatus }) =>
    api.put<{ data: Task }>(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  adminGetAll: (params?: { page?: number; limit?: number; status?: TaskStatus }) =>
    api.get<{ data: TasksResponse }>('/admin/tasks', { params }),
};
