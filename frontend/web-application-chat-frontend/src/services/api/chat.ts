// services/api/chat.ts
import api from './api';

export const chatApi = {
  // Salons
  getRooms: () => api.get('/api/chat/rooms'),
  getRoomById: (id: number) => api.get(`/api/chat/rooms/${id}`),
  createRoom: (data: any) => api.post('/api/chat/rooms', data),
  updateRoom: (id: number, data: any) => api.put(`/api/chat/rooms/${id}`, data),
  deleteRoom: (id: number) => api.delete(`/api/chat/rooms/${id}`),
  searchRooms: (name: string) => api.get(`/api/chat/rooms/search?name=${name}`),
  
  // Participants
  getParticipants: (roomId: number) => api.get(`/api/chat/rooms/${roomId}/participants`),
  addParticipant: (data: any) => api.post('/api/chat/participants', data),
  removeParticipant: (roomId: number, userId: number) => 
    api.delete(`/api/chat/rooms/${roomId}/participants/${userId}`),
  
  // Statistiques
  countParticipants: (roomId: number) => api.get(`/api/chat/rooms/${roomId}/participants/count`),
  isUserParticipant: (userId: number, roomId: number) => 
    api.get(`/api/chat/users/${userId}/is-participant/${roomId}`),
  isUserAdmin: (userId: number, roomId: number) => 
    api.get(`/api/chat/users/${userId}/is-admin/${roomId}`),
};