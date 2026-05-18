import { api } from './axios';

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<{ data: AuthResponse }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ data: AuthResponse }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<{ data: AuthResponse }>('/auth/refresh'),
};
