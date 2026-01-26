// services/api/message.ts
import api from './api';

export const messageApi = {
  // Messages
  getOrderedMessages: (roomId: number) => api.get(`/api/chat/rooms/${roomId}/messages/ordered`),
  getMessageById: (id: number) => api.get(`/api/chat/messages/${id}`),
  createMessage: (userId: number, data: any) => 
    api.post('/api/chat/messages', data, {
      headers: { 'X-User-Id': userId }
    }),
  updateMessage: (messageId: number, data: any) => 
    api.put(`/api/chat/messages/${messageId}`, data),
  deleteMessage: (messageId: number) => api.delete(`/api/chat/messages/${messageId}`),
  restoreMessage: (messageId: number) => api.post(`/api/chat/messages/${messageId}/restore`),
};