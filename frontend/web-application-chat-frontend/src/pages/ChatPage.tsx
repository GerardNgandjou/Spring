// src/pages/ChatPage.tsx - VERSION AMÉLIORÉE AVEC AFFICHAGE CHRONOLOGIQUE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, type Message, type ChatRoom, type ChatParticipant } from '../services/api/chat'; 
import toast from 'react-hot-toast';

// MUI Components
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Drawer,
  Badge,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  ListItemButton,
  Menu,
  MenuItem,
  Tooltip,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { chatWebSocket } from '../services/chatWebsocket';
import { type MessageResponse } from '../types';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

// ==================== FORMATAGE DES DATES ====================
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('❌ Invalid date string:', dateString);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('❌ Error formatting date:', error, dateString);
    return 'Date invalide';
  }
};

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }

    // Aujourd'hui
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } 
    // Hier
    else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    // Cette semaine
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    if (date > weekAgo) {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
    
    // Plus ancien
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date for grouping:', error);
    return 'Date invalide';
  }
};

// Fonction pour regrouper les messages par date
const groupMessagesByDate = (messages: Message[]): { date: string; messages: Message[] }[] => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return Object.entries(groups)
    .map(([date, msgs]) => ({
      date: formatDate(msgs[0].createdAt),
      messages: msgs.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }))
    .sort((a, b) => 
      new Date(a.messages[0].createdAt).getTime() - new Date(b.messages[0].createdAt).getTime()
    );
};

// Fonction pour obtenir les initiales d'un utilisateur
const getInitials = (email?: string): string => {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
};

// Fonction pour obtenir une couleur d'avatar basée sur l'ID
const getAvatarColor = (userId: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];
  return colors[userId % colors.length];
};

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ==================== STATES ====================
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoomsDrawer, setShowRoomsDrawer] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  
  // WebSocket States
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const [messageStatus, setMessageStatus] = useState<Record<number, MessageStatusType>>({});
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);

  // UI States
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    message?: Message;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  const mapMessageResponseToMessage = (dto: MessageResponse): Message => {
    console.log('🔄 Mapping message DTO:', {
      dtoSenderId: dto.sender.id,
      dtoSenderEmail: dto.sender.email,
      currentUserId: user?.id
    });
    
    return {
      id: dto.id,
      content: dto.content,
      senderId: dto.sender.id,
      sender: dto.sender,
      chatRoomId: dto.chatRoomId,
      createdAt: dto.timestamp,
      updatedAt: dto.timestamp,
      isDeleted: dto.isDeleted,
    };
  };

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // ==================== LOAD ROOMS ON MOUNT ====================
  useEffect(() => {
    console.log('📥 Loading rooms...');
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setIsLoadingRooms(true);
      console.log('🔄 Fetching all chat rooms...');
      const response = await chatApi.getAllChatRooms();
      const roomsData = response.data || [];
      console.log('✅ Rooms loaded:', roomsData.length, roomsData);
      setRooms(roomsData);

      const newUnreadCounts: Record<number, number> = {};
      roomsData.forEach(room => {
        newUnreadCounts[room.id] = 0;
      });
      setUnreadCounts(newUnreadCounts);

      if (roomId) {
        const roomIdNum = parseInt(roomId);
        const room = roomsData.find(r => r.id === roomIdNum);
        if (room) {
          console.log('🎯 Selecting room from URL:', roomIdNum);
          await selectRoom(room);
        }
      } else if (roomsData.length > 0) {
        console.log('🎯 Selecting first room');
        await selectRoom(roomsData[0]);
      }
    } catch (error) {
      console.error('❌ Error loading rooms:', error);
      toast.error('Erreur lors du chargement des salons');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // ==================== WEBSOCKET INITIALIZATION ====================
  useEffect(() => {
    if (!token || !user?.id) {
      console.log('❌ Missing token or user ID');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    
    const handleConnectionChange = (connected: boolean) => {
      console.log('📡 WebSocket connection status:', connected);
      setIsWsConnected(connected);
      if (connected) {
        setConnectionError(null);
        setShowConnectionAlert(false);
        setConnectionRetryCount(0);
        toast.success('Connexion établie');
      } else {
        setConnectionError('Connexion perdue');
        setShowConnectionAlert(true);
        setConnectionRetryCount(prev => prev + 1);
      }
    };

    const handleNewMessage = (messageDto: MessageResponse) => {
      console.log('📨 New message received:', messageDto);
      const message = mapMessageResponseToMessage(messageDto);
      
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        console.log('✅ Adding new message to state');
        return [...prev, message];
      });

      if (message.chatRoomId !== currentRoom?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.chatRoomId]: (prev[message.chatRoomId] || 0) + 1
        }));
      }

      setTimeout(() => scrollToBottom(), 100);
    };

    const handleTypingStatus = (data: { userId: number; isTyping: boolean; roomId: number }) => {
      console.log('⌨️ Typing status:', data);
      if (data.roomId === currentRoom?.id && data.userId !== user.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    const handleError = (error: string) => {
      console.error('❌ WebSocket error:', error);
      setConnectionError(error);
      setShowConnectionAlert(true);
    };

    chatWebSocket.on('connectionChange', handleConnectionChange);
    chatWebSocket.on('message', handleNewMessage);
    chatWebSocket.on('typing', handleTypingStatus);
    chatWebSocket.on('error', handleError);

    chatWebSocket.connect(token, user.id);

    return () => {
      console.log('🔌 Cleaning up WebSocket...');
      chatWebSocket.off('connectionChange', handleConnectionChange);
      chatWebSocket.off('message', handleNewMessage);
      chatWebSocket.off('typing', handleTypingStatus);
      chatWebSocket.off('error', handleError);
      chatWebSocket.disconnect();
    };
  }, [token, user?.id]);

  // ==================== SELECT ROOM ====================
  const selectRoom = async (room: ChatRoom) => {
    try {
      console.log('🎯 Selecting room:', room.id, room.name);
      setCurrentRoom(room);
      setMessages([]);
      setIsLoading(true);
      navigate(`/chat/${room.id}`);

      setUnreadCounts(prev => ({
        ...prev,
        [room.id]: 0
      }));

      const [messagesResponse, participantsResponse] = await Promise.all([
        chatApi.getMessages(room.id),
        chatApi.getParticipants(room.id)
      ]);

      const messagesData = messagesResponse.data || [];
      console.log('✅ Messages loaded:', messagesData.length);
      setMessages(messagesData);
      
      const participantsData = participantsResponse.data || [];
      console.log('✅ Participants loaded:', participantsData.length);
      setParticipants(participantsData);

      if (currentRoom?.id !== room.id) {
        chatWebSocket.leaveRoom(currentRoom!.id);
      }
      chatWebSocket.joinRoom(room.id);

      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('❌ Error selecting room:', error);
      toast.error('Erreur lors du chargement du salon');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SEND MESSAGE ====================
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: user.id,
      sender: { id: user.id, email: user.email },
      chatRoomId: currentRoom.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    scrollToBottom();

    try {
      console.log('📤 Sending message via WebSocket:', messageContent);
      chatWebSocket.sendMessage(currentRoom.id, messageContent);
      
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessageStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[tempId];
          return newStatus;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  // ==================== TYPING INDICATOR ====================
  const handleTyping = () => {
    if (!currentRoom) return;

    chatWebSocket.sendTypingStatus(currentRoom.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatWebSocket.sendTypingStatus(currentRoom.id, false);
    }, 1000);
  };

  // ==================== CREATE ROOM ====================
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Le nom du salon est requis');
      return;
    }

    try {
      const response = await chatApi.createChatRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || undefined,
        isPrivate: isPrivateRoom,
      });

      console.log('✅ Room created:', response.data);
      toast.success('Salon créé avec succès');

      setShowNewRoomDialog(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivateRoom(false);

      await loadRooms();
      
      if (response.data) {
        await selectRoom(response.data);
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      toast.error('Erreur lors de la création du salon');
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      message,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleMessageAction = (action: string, message?: Message) => {
    if (!message) return;

    switch (action) {
      case 'reply':
        setReplyingTo(message);
        messageInputRef.current?.focus();
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        toast.success('Message copié');
        break;
    }
    handleContextMenuClose();
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== RENDER MESSAGE BUBBLE ====================
  const renderMessageBubble = (message: Message, isOwnMessage: boolean) => {
    const senderInfo = participants.find(p => p.userId === message.senderId);
    const senderEmail = message.sender?.email || senderInfo?.user?.email || 'Inconnu';
    const status = messageStatus[message.id];

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          mb: 1.5,
          gap: 1,
          px: 2,
        }}
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        {/* Avatar */}
        {!isOwnMessage && (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: getAvatarColor(message.senderId),
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {getInitials(senderEmail)}
          </Avatar>
        )}

        {/* Message Bubble */}
        <Box
          sx={{
            maxWidth: { xs: '75%', sm: '60%', md: '50%' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Sender Name (only for received messages) */}
          {!isOwnMessage && (
            <Typography
              variant="caption"
              sx={{
                color: getAvatarColor(message.senderId),
                fontWeight: 600,
                mb: 0.5,
                ml: 1,
              }}
            >
              {senderEmail.split('@')[0]}
            </Typography>
          )}

          {/* Message Content */}
          <Paper
            elevation={1}
            sx={{
              py: 1,
              px: 1.5,
              borderRadius: 2,
              bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              borderBottomRightRadius: isOwnMessage ? 4 : 16,
              borderBottomLeftRadius: isOwnMessage ? 16 : 4,
              wordWrap: 'break-word',
              position: 'relative',
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>

            {/* Time & Status */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                justifyContent: 'flex-end',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  opacity: 0.8,
                  color: isOwnMessage ? 'inherit' : 'text.secondary',
                }}
              >
                {formatTime(message.createdAt)}
              </Typography>
              
              {/* Status Icons for own messages */}
              {isOwnMessage && (
                <>
                  {status === 'sending' && (
                    <CircularProgress size={10} sx={{ color: 'inherit', opacity: 0.8 }} />
                  )}
                  {status === 'sent' && (
                    <CheckIcon sx={{ fontSize: 14, opacity: 0.8 }} />
                  )}
                  {status === 'delivered' && (
                    <DoneAllIcon sx={{ fontSize: 14, opacity: 0.8 }} />
                  )}
                  {status === 'read' && (
                    <DoneAllIcon sx={{ fontSize: 14, color: '#4fc3f7' }} />
                  )}
                  {status === 'error' && (
                    <Typography variant="caption" sx={{ color: 'error.light' }}>!</Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Own message avatar placeholder for alignment */}
        {isOwnMessage && (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: getAvatarColor(user?.id || 0),
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {getInitials(user?.email)}
          </Avatar>
        )}
      </Box>
    );
  };

  // ==================== RENDER ====================
  if (!user) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Typography>Veuillez vous connecter</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* CONNECTION ALERT */}
      <Snackbar
        open={showConnectionAlert}
        autoHideDuration={6000}
        onClose={() => setShowConnectionAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowConnectionAlert(false)}
          severity={isWsConnected ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {isWsConnected ? 'Connexion rétablie' : connectionError || 'Connexion perdue'}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* ROOMS SIDEBAR DESKTOP */}
        <Paper
          square
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            width: 320,
            borderRight: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold">Messages</Typography>
              <Box display="flex" gap={1}>
                <Tooltip title={isWsConnected ? 'Connecté' : 'Déconnecté'}>
                  <IconButton size="small" color={isWsConnected ? 'success' : 'error'}>
                    {isWsConnected ? <WifiIcon /> : <WifiOffIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Nouveau salon">
                  <IconButton size="small" onClick={() => setShowNewRoomDialog(true)}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher un salon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Rooms List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoadingRooms ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : filteredRooms.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={3}>
                <Typography color="text.secondary" variant="body2">
                  {searchQuery ? 'Aucun salon trouvé' : 'Aucun salon disponible'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredRooms.map((room) => (
                  <ListItemButton
                    key={room.id}
                    selected={currentRoom?.id === room.id}
                    onClick={() => selectRoom(room)}
                    sx={{
                      py: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={unreadCounts[room.id] || 0}
                        color="error"
                        max={99}
                        invisible={!unreadCounts[room.id]}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <GroupIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={unreadCounts[room.id] ? 700 : 500}>
                          {room.name}
                        </Typography>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">
                            {room.participantCount || 0} participants
                          </Typography>
                          {room.isPrivate && (
                            <Chip icon={<LockIcon />} label="Privé" size="small" />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* CHAT AREA */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <Paper
                square
                elevation={1}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <IconButton
                    sx={{ display: { xs: 'block', md: 'none' } }}
                    onClick={() => setShowRoomsDrawer(true)}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {currentRoom.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {participants.length} participant{participants.length > 1 ? 's' : ''}
                      {typingUsers.size > 0 && ' • en train d\'écrire...'}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title={isWsConnected ? 'Connecté' : 'Déconnecté'}>
                    <IconButton color={isWsConnected ? 'success' : 'error'}>
                      {isWsConnected ? <WifiIcon /> : <WifiOffIcon />}
                    </IconButton>
                  </Tooltip>
                  <IconButton onClick={() => setShowParticipantsDrawer(true)}>
                    <GroupIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  bgcolor: 'background.default',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                {isLoading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
                      <GroupIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Aucun message pour le moment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Soyez le premier à envoyer un message !
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ py: 2 }}>
                    {groupMessagesByDate(messages).map((group, groupIndex) => (
                      <Box key={groupIndex}>
                        {/* Date Separator */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            my: 3,
                          }}
                        >
                          <Chip
                            label={group.date}
                            size="small"
                            sx={{
                              bgcolor: 'background.paper',
                              fontWeight: 600,
                              px: 2,
                            }}
                          />
                        </Box>

                        {/* Messages for this date */}
                        {group.messages.map((message) => {
                          const isOwnMessage = message.senderId === user.id;
                          return renderMessageBubble(message, isOwnMessage);
                        })}
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <Box sx={{ px: 3, py: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {Array.from(typingUsers).map(userId => {
                      const participant = participants.find(p => p.userId === userId);
                      return participant?.user?.email?.split('@')[0] || 'Quelqu\'un';
                    }).join(', ')} {typingUsers.size > 1 ? 'sont' : 'est'} en train d'écrire...
                  </Typography>
                </Box>
              )}

              {/* Reply To Banner */}
              {replyingTo && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <ReplyIcon fontSize="small" />
                    <Box>
                      <Typography variant="caption" fontWeight="bold">
                        Répondre à {replyingTo.sender?.email?.split('@')[0]}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                        {replyingTo.content}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyingTo(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Message Input */}
              <Paper
                square
                elevation={3}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box display="flex" gap={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    inputRef={messageInputRef}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isWsConnected}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground',
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Paper>
            </>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              gap={3}
            >
              <Avatar sx={{ width: 120, height: 120, bgcolor: 'primary.light' }}>
                <GroupIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h4" align="center">
                Bienvenue dans le chat !
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 500 }}>
                Sélectionnez un salon ou créez-en un nouveau pour commencer à chatter.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setShowNewRoomDialog(true)}
              >
                Créer un salon
              </Button>
            </Box>
          )}
        </Box>

        {/* PARTICIPANTS SIDEBAR DESKTOP */}
        <Paper
          square
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            width: 280,
            borderLeft: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Participants ({participants.length})</Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {participants.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={3}>
                <Typography color="text.secondary" variant="body2">Aucun participant</Typography>
              </Box>
            ) : (
              <List>
                {participants.map((participant) => (
                  <ListItem key={participant.id} sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor: getAvatarColor(participant.userId),
                      }}>
                        {getInitials(participant.user?.email)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="subtitle2">
                            {participant.user?.email?.split('@')[0] || `User ${participant.userId}`}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Chip
                          size="small"
                          label={participant.role}
                          color={participant.role === 'OWNER' ? 'error' :
                            participant.role === 'ADMIN' ? 'primary' : 'default'}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Box>

      {/* DRAWER ROOMS MOBILE */}
      <Drawer
        anchor="left"
        open={showRoomsDrawer}
        onClose={() => setShowRoomsDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: '85vw', maxWidth: 400 } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Salons</Typography>
            <IconButton onClick={() => setShowRoomsDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {rooms.map(room => (
              <ListItemButton
                key={room.id}
                selected={currentRoom?.id === room.id}
                onClick={() => {
                  selectRoom(room);
                  setShowRoomsDrawer(false);
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <GroupIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={room.name}
                  secondary={`${room.participantCount || 0} participants`}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* DRAWER PARTICIPANTS MOBILE */}
      <Drawer
        anchor="right"
        open={showParticipantsDrawer}
        onClose={() => setShowParticipantsDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: '85vw', maxWidth: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Participants ({participants.length})</Typography>
            <IconButton onClick={() => setShowParticipantsDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {participants.map((participant) => (
              <ListItem key={participant.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(participant.userId) }}>
                    {getInitials(participant.user?.email)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.user?.email?.split('@')[0] || `User ${participant.userId}`}
                  secondary={
                    <Chip
                      size="small"
                      label={participant.role}
                      color={participant.role === 'OWNER' ? 'error' : 'default'}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* DIALOG CREATE ROOM */}
      <Dialog
        open={showNewRoomDialog}
        onClose={() => setShowNewRoomDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer un nouveau salon</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du salon"
            fullWidth
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optionnel)"
            fullWidth
            multiline
            rows={3}
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1">Type</Typography>
            <Chip
              label="Public"
              color={!isPrivateRoom ? 'primary' : 'default'}
              onClick={() => setIsPrivateRoom(false)}
              variant={!isPrivateRoom ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<LockIcon />}
              label="Privé"
              color={isPrivateRoom ? 'secondary' : 'default'}
              onClick={() => setIsPrivateRoom(true)}
              variant={isPrivateRoom ? 'filled' : 'outlined'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewRoomDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!newRoomName.trim()}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONTEXT MENU */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        {contextMenu?.message && (
          <>
            <MenuItem onClick={() => handleMessageAction('reply', contextMenu.message)}>
              <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Répondre</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleMessageAction('copy', contextMenu.message)}>
              <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Copier</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default ChatPage;