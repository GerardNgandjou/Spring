// src/hooks/useChat.ts
import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';
import { chatWebSocket } from '../services/chatWebsocket';

export interface UseChatOptions {
  userId: number;
  token: string;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useChat = ({
  userId,
  token,
  onError,
  onConnect,
  onDisconnect,
}: UseChatOptions) => {
  const isMounted = useRef(true);

  // Get Zustand store
  const {
    rooms,
    selectedRoomId,
    messages,
    addMessage,
    selectRoom,
    setLoadingMessages,
    resetUnreadCount,
  } = useChatStore();

  // ==================== Initialisation ====================
  useEffect(() => {
    if (!token || !userId) {
      console.error('❌ Missing token or userId for chat');
      return;
    }

    console.log('🔌 Initializing chat connection...');

    // Gestionnaires d'événements
    const handleConnect = () => {
      if (!isMounted.current) return;
      console.log('✅ Chat connected');
      onConnect?.();

      // Rejoindre les rooms
      rooms.forEach((room) => {
        chatWebSocket.joinRoom(room.id);
      });
    };

    const handleDisconnect = () => {
      if (!isMounted.current) return;
      console.log('❌ Chat disconnected');
      onDisconnect?.();
    };

    const handleError = (error: string) => {
      if (!isMounted.current) return;
      console.error('WebSocket error:', error);
      onError?.(error);
      toast.error(`Erreur: ${error}`);
    };

    const handleMessageConfirmation = (confirmation: any) => {
      console.log('✅ Message confirmation:', confirmation);
      // Les confirmations sont gérées dans le composant parent
    };

    // S'abonner aux événements
    const unsubConnect = chatWebSocket.onConnect(handleConnect);
    const unsubDisconnect = chatWebSocket.onDisconnect(handleDisconnect);
    const unsubError = chatWebSocket.onError(handleError);
    const unsubConfirmation = chatWebSocket.onMessageConfirmation(
      handleMessageConfirmation
    );

    // Connecter
    chatWebSocket.connect(token, userId);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up chat connection...');
      unsubConnect();
      unsubDisconnect();
      unsubError();
      unsubConfirmation();
    };
  }, [token, userId, rooms, onConnect, onDisconnect, onError]);

  // ==================== Sélectionner une Room ====================
  const joinRoom = useCallback(
    async (roomId: number) => {
      console.log(`🚪 Joining room ${roomId}...`);

      selectRoom(roomId);
      resetUnreadCount(roomId);
      setLoadingMessages(true);

      try {
        // Charger les messages existants depuis l'API REST
        // (À adapter selon ton API)
        // const messagesResponse = await chatApi.getMessagesByRoom(roomId);
        // setMessages(messagesResponse.data);

        // S'abonner au WebSocket
        chatWebSocket.joinRoom(roomId);

        // S'abonner aux nouveaux messages
        const unsubscribe = chatWebSocket.onRoomMessage(roomId, (message) => {
          console.log(`📨 New message in room ${roomId}:`, message.id);
          addMessage(message);
        });

        // Cleanup: se désabonner quand on quitte le composant
        return () => {
          console.log(`👋 Leaving room ${roomId}...`);
          chatWebSocket.leaveRoom(roomId);
          unsubscribe();
        };
      } catch (error) {
        console.error('❌ Error joining room:', error);
        onError?.(`Error joining room: ${error}`);
        toast.error('Erreur lors de l\'accès à la salle');
      } finally {
        setLoadingMessages(false);
      }
    },
    [selectRoom, resetUnreadCount, setLoadingMessages, addMessage, onError]
  );

  // ==================== Envoyer un Message ====================
  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedRoomId) {
        console.error('❌ No room selected');
        toast.error('Aucune salle sélectionnée');
        return false;
      }

      if (!content.trim()) {
        console.warn('⚠️ Empty message');
        return false;
      }

      console.log(`✉️ Sending message to room ${selectedRoomId}...`);

      try {
        const success = await chatWebSocket.sendMessage(selectedRoomId, content);

        if (!success) {
          console.error('❌ Failed to send message');
          toast.error('Erreur lors de l\'envoi du message');
          return false;
        }

        console.log('✅ Message sent successfully');
        return true;
      } catch (error) {
        console.error('❌ Error sending message:', error);
        onError?.(`Error sending message: ${error}`);
        toast.error('Erreur lors de l\'envoi du message');
        return false;
      }
    },
    [selectedRoomId, onError]
  );

  // ==================== Typing Notification ====================
  const sendTypingNotification = useCallback(
    (isTyping: boolean) => {
      if (!selectedRoomId) return;

      console.log(
        `⌨️ Sending typing notification for room ${selectedRoomId}: ${isTyping}`
      );
      chatWebSocket.sendTypingNotification(selectedRoomId, isTyping);
    },
    [selectedRoomId]
  );

  // ==================== État de Connexion ====================
  const isConnected = chatWebSocket.isConnectionActive();
  const isConnecting = chatWebSocket.isConnecting();

  return {
    // État
    rooms,
    selectedRoomId,
    messages,
    isConnected,
    isConnecting,

    // Actions
    joinRoom,
    sendMessage,
    sendTypingNotification,
  };
};