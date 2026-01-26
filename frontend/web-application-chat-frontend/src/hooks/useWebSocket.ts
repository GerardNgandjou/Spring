import { useEffect, useRef, useCallback } from 'react';
import { webSocketService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface UseWebSocketProps {
  roomId: number | null;
  onMessage: (message: any) => void;
  onTyping?: (userId: number, isTyping: boolean) => void;
  onUserJoin?: (userId: number, username: string) => void;
}

export const useWebSocket = ({
  roomId,
  onMessage,
  onTyping,
  onUserJoin,
}: UseWebSocketProps) => {
  const { token, user } = useAuth();
  const isConnected = useRef(false);

  const connect = useCallback(() => {
    if (token && roomId && user && !isConnected.current) {
      try {
        webSocketService.connect(token, roomId, (message) => {
          // Gérer différents types de messages
          if (message.type === 'TYPING') {
            onTyping?.(message.userId, message.isTyping);
          } else if (message.type === 'USER_JOIN') {
            onUserJoin?.(message.userId, message.username);
          } else {
            onMessage(message);
          }
        });
        
        // Rejoindre le salon
        webSocketService.joinRoom(user.id);
        isConnected.current = true;
        
        console.log('WebSocket connected to room:', roomId);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        toast.error('Erreur de connexion WebSocket');
      }
    }
  }, [token, roomId, user, onMessage, onTyping, onUserJoin]);

  const disconnect = useCallback(() => {
    if (isConnected.current) {
      webSocketService.disconnect();
      isConnected.current = false;
      console.log('WebSocket disconnected');
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (roomId) {
      webSocketService.sendMessage({
        content,
        chatRoomId: roomId,
      });
    }
  }, [roomId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (roomId) {
      webSocketService.sendTyping(isTyping);
    }
  }, [roomId]);

  // Connexion/déconnexion automatique
  useEffect(() => {
    if (roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, roomId]);

  return {
    sendMessage,
    sendTyping,
    isConnected: isConnected.current,
    disconnect,
  };
};