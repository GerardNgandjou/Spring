import api from './api';
import type { ApiResponse } from '../../types/auth.types';

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, role?: string) => 
    api.post('/auth/register', { email, password, role }),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  refreshToken: () => api.post('/auth/refresh-token'),
  
  checkEmail: (email: string) => 
    api.get(`/auth/check-email?email=${encodeURIComponent(email)}`),

  validateToken: (token: string): Promise<ApiResponse<any>> => 
    api.post('/auth/validate-token', null, { params: { token } }),
};


