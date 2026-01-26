import { useState, useCallback } from 'react';
import { chatApi } from '../services/api/chat';
import { toast } from 'react-hot-toast';
import { messageApi } from '../services/api/message';
import type { ChatRoomResponse } from '../types';
import type { MessageResponse } from '../types/message.type';

export const useChat = () => {
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState({
    rooms: false,
    messages: false,
  });

  // Charger les salons
  const loadRooms = useCallback(async () => {
    setLoading(prev => ({ ...prev, rooms: true }));
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
      return data;
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Erreur lors du chargement des salons');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, []);

  // Charger les messages
  const loadMessages = useCallback(async (roomId: number) => {
    if (!roomId) return;
    
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const data = await messageApi.getOrderedMessages(roomId);
      setMessages(data);
      return data;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, []);

  // Créer un salon
  const createRoom = useCallback(async (name: string, type: 'PRIVATE' | 'GROUP' = 'GROUP') => {
    try {
      const newRoom = await chatApi.createRoom({
        name,
        type,
      });
      
      setRooms(prev => [...prev, newRoom]);
      toast.success('Salon créé avec succès');
      return newRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Erreur lors de la création du salon');
      throw error;
    }
  }, []);

  return {
    rooms,
    selectedRoom,
    messages,
    loading,
    setRooms,
    setSelectedRoom,
    setMessages,
    loadRooms,
    loadMessages,
    createRoom,
  };
};