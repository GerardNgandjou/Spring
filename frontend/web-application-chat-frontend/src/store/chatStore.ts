import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ChatRoomResponse } from '../types/chat.types';
import type { MessageResponse } from '../types/message.type';
import type { UserResponse } from '../types/user.types';

interface ChatState {
  // État
  rooms: ChatRoomResponse[];
  selectedRoom: ChatRoomResponse | null;
  messages: MessageResponse[];
  onlineUsers: UserResponse[];
  unreadCounts: Record<number, number>;
  
  // Actions
  setRooms: (rooms: ChatRoomResponse[]) => void;
  addRoom: (room: ChatRoomResponse) => void;
  updateRoom: (roomId: number, updates: Partial<ChatRoomResponse>) => void;
  deleteRoom: (roomId: number) => void;
  
  setSelectedRoom: (room: ChatRoomResponse | null) => void;
  
  setMessages: (messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  updateMessage: (messageId: number, updates: Partial<MessageResponse>) => void;
  deleteMessage: (messageId: number) => void;
  
  setOnlineUsers: (users: UserResponse[]) => void;
  addOnlineUser: (user: UserResponse) => void;
  removeOnlineUser: (userId: number) => void;
  
  incrementUnreadCount: (roomId: number) => void;
  resetUnreadCount: (roomId: number) => void;
  
  // Utilitaires
  getUnreadCount: (roomId: number) => number;
  getTotalUnreadCount: () => number;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        rooms: [],
        selectedRoom: null,
        messages: [],
        onlineUsers: [],
        unreadCounts: {},
        
        // Actions
        setRooms: (rooms) => set({ rooms }),
        
        addRoom: (room) =>
          set((state) => ({
            rooms: [...state.rooms, room],
          })),
        
        updateRoom: (roomId, updates) =>
          set((state) => ({
            rooms: state.rooms.map((room) =>
              room.id === roomId ? { ...room, ...updates } : room
            ),
          })),
        
        deleteRoom: (roomId) =>
          set((state) => ({
            rooms: state.rooms.filter((room) => room.id !== roomId),
            selectedRoom: state.selectedRoom?.id === roomId ? null : state.selectedRoom,
          })),
        
        setSelectedRoom: (room) => {
          if (room) {
            // Réinitialiser le compteur de messages non lus quand on sélectionne un salon
            set((state) => ({
              selectedRoom: room,
              unreadCounts: {
                ...state.unreadCounts,
                [room.id]: 0,
              },
            }));
          } else {
            set({ selectedRoom: null });
          }
        },
        
        setMessages: (messages) => set({ messages }),
        
        addMessage: (message) =>
          set((state) => {
            // Si le message n'est pas dans le salon actuel, incrémenter le compteur de non lus
            if (state.selectedRoom?.id !== message.chatRoomId) {
              return {
                messages: [...state.messages, message],
                unreadCounts: {
                  ...state.unreadCounts,
                  [message.chatRoomId]: (state.unreadCounts[message.chatRoomId] || 0) + 1,
                },
              };
            }
            return {
              messages: [...state.messages, message],
            };
          }),
        
        updateMessage: (messageId, updates) =>
          set((state) => ({
            messages: state.messages.map((message) =>
              message.id === messageId ? { ...message, ...updates } : message
            ),
          })),
        
        deleteMessage: (messageId) =>
          set((state) => ({
            messages: state.messages.map((message) =>
              message.id === messageId ? { ...message, isDeleted: true } : message
            ),
          })),
        
        setOnlineUsers: (users) => set({ onlineUsers: users }),
        
        addOnlineUser: (user) =>
          set((state) => ({
            onlineUsers: [...state.onlineUsers, user],
          })),
        
        removeOnlineUser: (userId) =>
          set((state) => ({
            onlineUsers: state.onlineUsers.filter((user) => user.id !== userId),
          })),
        
        incrementUnreadCount: (roomId) =>
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [roomId]: (state.unreadCounts[roomId] || 0) + 1,
            },
          })),
        
        resetUnreadCount: (roomId) =>
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [roomId]: 0,
            },
          })),
        
        // Utilitaires
        getUnreadCount: (roomId) => {
          return get().unreadCounts[roomId] || 0;
        },
        
        getTotalUnreadCount: () => {
          return Object.values(get().unreadCounts).reduce((sum, count) => sum + count, 0);
        },
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          rooms: state.rooms,
          unreadCounts: state.unreadCounts,
        }),
      }
    )
  )
);