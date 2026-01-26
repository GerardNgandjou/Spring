// services/api/user.ts
import api from './api';

export const userApi = {
  // Récupérer tous les utilisateurs (Admin seulement)
  getAllUsers: () => api.get('/api/users'),
  
  // Récupérer un utilisateur par ID
  getUserById: (id: number) => api.get(`/api/users/${id}`),
  
  // Mettre à jour un utilisateur
  updateUser: (id: number, data: { isActive: boolean; password: string }) =>
    api.put(`/api/users/${id}`, data),
  
  // Supprimer un utilisateur
  deleteUser: (id: number) => api.delete(`/api/users/${id}`),
  
  // Récupérer les utilisateurs par rôle
  getUsersByRole: (role: string) => api.get(`/api/users/role/${role}`),
  
  // Récupérer les utilisateurs par plage de dates
  getUsersByDateRange: (startDate: string, endDate: string) =>
    api.get(`/api/users/date-range?startDate=${startDate}&endDate=${endDate}`),
};