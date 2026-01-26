import { useEffect, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuth } from '../contexts/AuthContext';
import toast, { type ToastOptions } from 'react-hot-toast';
import type { MessageResponse } from '../types/message.type';

export const useNotifications = () => {
  const { user } = useAuth();
  const { selectedRoom, incrementUnreadCount } = useChatStore();

  const showNotification = useCallback((
    title: string,
    message: string,
    options?: ToastOptions
  ) => {
    // Vérifier si les notifications sont supportées
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }

    // Toujours afficher une notification toast
    toast(message, {
      position: 'top-right',
      duration: 4000,
      ...options,
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Gérer les nouveaux messages
  const handleNewMessage = useCallback((message: MessageResponse) => {
    // Ne pas notifier si c'est notre propre message
    if (message.sender.id === user?.id) return;

    // Ne pas notifier si on est dans le salon du message
    if (selectedRoom?.id === message.chatRoomId) return;

    // Incrémenter le compteur de non lus
    incrementUnreadCount(message.chatRoomId);

    // Afficher la notification
    showNotification(
      `Nouveau message de ${message.sender.email}`,
      message.content,
      {
        icon: '💬',
      }
    );
  }, [user, selectedRoom, incrementUnreadCount, showNotification]);

  // Gérer les utilisateurs qui rejoignent
  const handleUserJoined = useCallback((userId: number, username: string) => {
    showNotification(
      'Nouveau participant',
      `${username} a rejoint le salon`,
      {
        icon: '👋',
      }
    );
  }, [showNotification]);

  // Gérer les notifications de frappe
  const handleTyping = useCallback((userId: number, isTyping: boolean) => {
    // Pourrait être utilisé pour afficher "X est en train d'écrire..."
    console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
  }, []);

  // Demander la permission des notifications au chargement
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    showNotification,
    requestNotificationPermission,
    handleNewMessage,
    handleUserJoined,
    handleTyping,
  };
};