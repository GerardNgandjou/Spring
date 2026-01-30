// src/pages/ChatPage.tsx - VERSION FINALE FONCTIONNELLE
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
} from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { chatWebSocket } from '../services/chatWebsocket';
import { type MessageResponse } from '../types';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error('❌ Invalid date string:', dateString);
      return 'Date invalide';
    }
    
    // Formater en français
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

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  } catch (error) {
    console.error('Error formatting date for grouping:', error);
    return 'Date invalide';
  }
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
      senderId: dto.sender.id, // IMPORTANT: doit correspondre à user?.id
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

      // Initialiser les compteurs
      const newUnreadCounts: Record<number, number> = {};
      roomsData.forEach(room => {
        newUnreadCounts[room.id] = 0;
      });
      setUnreadCounts(newUnreadCounts);

      // Sélectionner une salle par défaut
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

    console.log('🔌 Initializing WebSocket...');
    let isMounted = true;

    const handleConnect = () => {
      if (!isMounted) return;
      console.log('✅ WebSocket connected');
      setIsWsConnected(true);
      setConnectionError(null);
      setConnectionRetryCount(0);
      toast.success('Connecté au chat en temps réel', { icon: '✅', duration: 2000 });
    };

    const handleDisconnect = () => {
      if (!isMounted) return;
      console.log('❌ WebSocket disconnected');
      setIsWsConnected(false);
      setShowConnectionAlert(true);
      toast.error('Déconnecté du chat en temps réel', { icon: '❌', duration: 3000 });
    };

    const handleError = (error: string) => {
      if (!isMounted) return;
      console.error('❌ WebSocket error:', error);
      setConnectionError(error);
      toast.error(`Erreur: ${error}`);
    };

    // S'abonner aux événements
    const unsubConnect = chatWebSocket.onConnect(handleConnect);
    const unsubDisconnect = chatWebSocket.onDisconnect(handleDisconnect);
    const unsubError = chatWebSocket.onError(handleError);

    // Connecter
    chatWebSocket.connect(token, user.id);

    return () => {
      console.log('🧹 Cleaning up WebSocket');
      isMounted = false;
      unsubConnect();
      unsubDisconnect();
      unsubError();
      chatWebSocket.disconnect();
    };
  }, [token, user?.id]);

  // ==================== SELECT ROOM ====================
  const selectRoom = async (room: ChatRoom) => {
    try {
      setIsLoading(true);
      console.log(`🚪 Selecting room ${room.id}...`);

      setCurrentRoom(room);
      navigate(`/chat/${room.id}`);

      // Charger messages et participants
      console.log(`📥 Loading messages for room ${room.id}...`);
      const [messagesRes, participantsRes] = await Promise.all([
        chatApi.getMessagesByRoomOrdered(room.id),
        chatApi.getParticipantsByRoom(room.id)
      ]);

      const messagesData = messagesRes.data || [];
      const participantsData = participantsRes.data || [];
      
      console.log('✅ Messages loaded:', messagesData.length);
      console.log('✅ Participants loaded:', participantsData.length);

      setMessages(messagesData);
      setParticipants(participantsData);

      // Rejoindre via WebSocket
      if (isWsConnected) {
        console.log('📡 Joining room via WebSocket...');
        chatWebSocket.joinRoom(room.id);
      }

      // Reset unread count
      setUnreadCounts(prev => ({
        ...prev,
        [room.id]: 0
      }));

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      toast.success(`Connecté à ${room.name}`);
    } catch (error) {
      console.error('❌ Error selecting room:', error);
      toast.error('Erreur lors du chargement du salon');
    } finally {
      setIsLoading(false);
      if (isMobile) setShowRoomsDrawer(false);
    }
  };

  // ==================== JOIN ROOM WHEN CONNECTED ====================
  useEffect(() => {
    if (isWsConnected && currentRoom) {
      console.log(`📡 Joining room ${currentRoom.id} via WebSocket...`);
      chatWebSocket.joinRoom(currentRoom.id);

      // S'abonner aux nouveaux messages
    const unsubscribe = chatWebSocket.onRoomMessage(
      currentRoom.id,
      (messageResponse) => {
        console.log('📨 New message received:', messageResponse);

        const message = mapMessageResponseToMessage(messageResponse);

        setMessages(prev => {
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
          return prev;
        });

        scrollToBottom();
      }
    );
    
      return () => {
        console.log(`👋 Leaving room ${currentRoom.id}`);
        chatWebSocket.leaveRoom(currentRoom.id);
        unsubscribe();
      };
    }
  }, [isWsConnected, currentRoom?.id]);

  // ==================== SEND MESSAGE ====================
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || !isWsConnected) {
      if (!isWsConnected) {
        toast.error('Pas connecté au chat');
      }
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = Date.now();

    try {
      // Clear input immediately
      setNewMessage('');
      
      // Add optimistic message
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        senderId: user?.id || 0,
        chatRoomId: currentRoom.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        sender: {
          id: user?.id || 0,
          email: user?.email || '',
        },
      };

      setMessages(prev => [...prev, tempMessage]);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
      scrollToBottom();

      console.log(`✉️ Sending message to room ${currentRoom.id}...`);
      const success = await chatWebSocket.sendMessage(currentRoom.id, messageContent);

      if (success) {
        console.log('✅ Message sent successfully');
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      } else {
        console.error('❌ Failed to send message');
        setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
        toast.error('Erreur lors de l\'envoi du message');
      }

      handleStopTyping();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessageStatus(prev => ({ ...prev, [tempId]: 'error' }));
      toast.error('Erreur lors de l\'envoi');
    }
  };

  // ==================== TYPING NOTIFICATIONS ====================

  const handleStopTyping = useCallback(() => {
    if (currentRoom && isWsConnected) {
      chatWebSocket.sendTypingNotification(currentRoom.id, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [currentRoom, isWsConnected]);

  // ==================== CREATE ROOM ====================
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Le nom du salon est requis');
      return;
    }

    try {
      console.log('🆕 Creating room:', newRoomName);
      const response = await chatApi.createChatRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || undefined,
        type: isPrivateRoom ? 'PRIVATE' : 'PUBLIC',
      });

      const newRoom = response.data;
      setRooms(prev => [...prev, newRoom]);
      await selectRoom(newRoom);

      setShowNewRoomDialog(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setIsPrivateRoom(false);

      toast.success('Salon créé avec succès');
    } catch (error) {
      console.error('❌ Error creating room:', error);
      toast.error('Erreur lors de la création du salon');
    }
  };

  // ==================== FORMATTING ====================
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  const getUserDisplayName = (message: Message) => {
    if (message.senderId === user?.id) return 'Vous';
    return message.sender?.email?.split('@')[0] || `Utilisateur ${message.senderId}`;
  };


  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, message?: Message) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6, message }
        : null,
    );
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

  const handleReconnect = () => {
    if (token && user?.id) {
      setConnectionRetryCount(0);
      chatWebSocket.connect(token, user.id);
      setShowConnectionAlert(false);
    }
  };

  if (!user || !token) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Vous devez être connecté</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* SNACKBAR CONNEXION */}
      <Snackbar
        open={showConnectionAlert}
        autoHideDuration={6000}
        onClose={() => setShowConnectionAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowConnectionAlert(false)}
          action={
            <Button color="inherit" size="small" onClick={handleReconnect}>
              <RefreshIcon sx={{ mr: 0.5 }} />
              Reconnecter
            </Button>
          }
        >
          <Box display="flex" alignItems="center">
            <WifiOffIcon sx={{ mr: 1 }} />
            {connectionError || 'Déconnecté'}
          </Box>
        </Alert>
      </Snackbar>

      {/* HEADER MOBILE */}
      <Paper
        square
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <IconButton onClick={() => setShowRoomsDrawer(true)} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        {currentRoom ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>{currentRoom.name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {participants.length} participants
            </Typography>
          </Box>
        ) : (
          <Typography variant="h6" sx={{ flex: 1 }}>Chat</Typography>
        )}
        <IconButton onClick={() => setShowParticipantsDrawer(true)}>
          <Badge badgeContent={participants.length} color="primary">
            <PersonIcon />
          </Badge>
        </IconButton>
      </Paper>

      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR ROOMS DESKTOP */}
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
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Salons</Typography>
              <Chip
                icon={isWsConnected ? <WifiIcon /> : <WifiOffIcon />}
                label={isWsConnected ? 'Connecté' : 'Déconnecté'}
                color={isWsConnected ? 'success' : 'error'}
                size="small"
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewRoomDialog(true)}
              sx={{ mb: 2 }}
            >
              Nouveau salon
            </Button>

            <TextField
              fullWidth
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* ROOMS LIST */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoadingRooms ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
              </Box>
            ) : rooms.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={3}>
                <Typography color="text.secondary">Aucun salon</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {rooms
                  .filter(room =>
                    room.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(room => (
                    <ListItemButton
                      key={room.id}
                      selected={currentRoom?.id === room.id}
                      onClick={() => selectRoom(room)}
                      sx={{
                        borderLeft: currentRoom?.id === room.id ? 4 : 0,
                        borderColor: 'primary.main',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{
                          bgcolor: room.type === 'PRIVATE' ? 'secondary.main' : 'primary.main'
                        }}>
                          <GroupIcon />
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography noWrap sx={{ flex: 1 }}>
                              {room.name}
                            </Typography>
                            {room.type === 'PRIVATE' && (
                              <LockIcon fontSize="small" />
                            )}
                          </Box>
                        }
                        secondary={`${room.participantCount || 0} participants`}
                      />
                    </ListItemButton>
                  ))}
              </List>
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              {rooms.length} salons
            </Typography>
          </Box>
        </Paper>

        {/* CHAT AREA */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {currentRoom ? (
            <>
              {/* HEADER DESKTOP */}
              <Paper
                square
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000,
                }}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <GroupIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" noWrap>{currentRoom.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {participants.length} participants
                  </Typography>
                </Box>
                <IconButton onClick={() => setShowParticipantsDrawer(true)}>
                  <Badge badgeContent={participants.length} color="primary">
                    <PersonIcon />
                  </Badge>
                </IconButton>
              </Paper>

              {/* MESSAGES */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: { xs: 1, md: 2 },
                  backgroundColor: 'grey.50',
                }}
              >
                {isLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    gap={2}
                  >
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
                      <GroupIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Bienvenue dans #{currentRoom.name}!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Soyez le premier à envoyer un message.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {Object.entries(groupMessagesByDate()).map(([date, dateMessages]) => (
                      <React.Fragment key={date}>
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                          <Box sx={{ flex: 1, height: 1, backgroundColor: 'divider' }} />
                          <Typography variant="caption" sx={{ mx: 2, color: 'text.secondary' }}>
                            {date}
                          </Typography>
                          <Box sx={{ flex: 1, height: 1, backgroundColor: 'divider' }} />
                        </Box>
                        {dateMessages.map((message, index) => {
                          // DEBUG: Afficher les infos pour chaque message
                          const messageDebug = {
                            messageId: message.id,
                            senderId: message.senderId,
                            currentUserId: user?.id,
                            isMe: message.senderId === user?.id,
                            senderEmail: message.sender?.email,
                            currentUserEmail: user?.email
                          };
                          console.log('📄 Rendering message:', messageDebug);
                          
                          // ✅ CORRECTION ICI: Vérifier correctement si c'est l'utilisateur courant
                          // Plusieurs façons de vérifier :
                          const isMe = 
                            // 1. Par ID (le plus fiable)
                            message.senderId === user?.id ||
                            // 2. Par email (backup)
                            (message.sender?.email && message.sender.email === user?.email) ||
                            // 3. Comparer les objets si possible
                            (message.sender && user && message.sender.id === user.id);
                          
                          console.log(`   -> isMe: ${isMe} (senderId:${message.senderId}, userId:${user?.id})`);
                          
                          const isConsecutive = index > 0 &&
                            dateMessages[index - 1].senderId === message.senderId &&
                            new Date(message.createdAt).getTime() - 
                            new Date(dateMessages[index - 1].createdAt).getTime() < 300000;

                          return (
                            <Box
                              key={message.id}
                              sx={{
                                mb: isConsecutive ? 0.5 : 2,
                                display: 'flex',
                                flexDirection: isMe ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                px: 2,
                              }}
                              onContextMenu={(e) => handleContextMenu(e, message)}
                            >
                              {/* Avatar - seulement pour les autres utilisateurs et non-consecutif */}
                              {!isMe && !isConsecutive && (
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 1,
                                    mb: 0.5,
                                    bgcolor: 'primary.main',
                                  }}
                                >
                                  {message.sender?.email?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
                              )}

                              {/* Espace pour garder l'alignement */}
                              {!isMe && isConsecutive && (
                                <Box sx={{ width: 40, mr: 1 }} />
                              )}

                              {/* Espace pour aligner les messages de l'utilisateur */}
                              {isMe && (
                                <Box sx={{ flex: 1 }} />
                              )}

                              {/* Bubble de message */}
                              <Tooltip
                                title={`${message.sender?.email || `User ${message.senderId}`} • ${formatDateTime(message.createdAt)}`}
                                placement={isMe ? 'left' : 'right'}
                              >
                                <Box
                                  sx={{
                                    maxWidth: { xs: '85%', md: '70%' },
                                    bgcolor: isMe ? 'primary.main' : 'background.paper',
                                    color: isMe ? 'white' : 'text.primary',
                                    borderRadius: 2,
                                    p: 1.5,
                                    boxShadow: 1,
                                    border: isMe ? 'none' : '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative',
                                  }}
                                >
                                  {/* Nom de l'expéditeur (uniquement pour les autres utilisateurs) */}
                                  {!isMe && !isConsecutive && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: 'block',
                                        mb: 0.5,
                                        fontWeight: 'bold',
                                        color: isMe ? 'inherit' : 'primary.main',
                                      }}
                                    >
                                      {message.sender?.email?.split('@')[0] || `User ${message.senderId}`}
                                    </Typography>
                                  )}

                                  {/* Contenu du message */}
                                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                    {message.content}
                                  </Typography>

                                  {/* Timestamp et statut */}
                                  <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 0.5,
                                  }}>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        opacity: 0.7, 
                                        fontSize: '0.75rem',
                                        fontStyle: isMe ? 'italic' : 'normal'
                                      }}
                                    >
                                      {formatTime(message.createdAt)}
                                    </Typography>

                                    {/* Statut d'envoi (uniquement pour l'utilisateur courant) */}
                                    {isMe && (
                                      <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {messageStatus[message.id] === 'sending' && (
                                          <CircularProgress size={12} color="inherit" />
                                        )}
                                        {messageStatus[message.id] === 'sent' && (
                                          <CheckCircleIcon sx={{ fontSize: 12 }} />
                                        )}
                                        {messageStatus[message.id] === 'error' && (
                                          <Typography variant="caption" sx={{ color: 'error.light' }}>
                                            ❌
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Box>

                                  {/* Indicateur de réponse */}
                                  {replyingTo?.id === message.id && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -4,
                                        [isMe ? 'right' : 'left']: -4,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Tooltip>

                              {/* Espace de l'autre côté */}
                              {!isMe && (
                                <Box sx={{ flex: 1 }} />
                              )}
                            </Box>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* REPLY TO */}
              {replyingTo && (
                <Paper
                  square
                  sx={{
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <ReplyIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Réponse à {getUserDisplayName(replyingTo)}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReplyingTo(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              )}

              {/* INPUT */}
              <Paper square sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  // onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  //   if (e.key === 'Enter' && !e.shiftKey) {
                  //     e.preventDefault();
                  //     handleSendMessage();
                  //   }
                  // }}
                  // onKeyPress={handleKeyPress}
                  onBlur={handleStopTyping}
                  placeholder="Écrivez votre message..."
                  variant="outlined"
                  disabled={!isWsConnected}
                  inputRef={messageInputRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || !isWsConnected}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '&.Mui-disabled': { bgcolor: 'grey.300' }
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {!isWsConnected && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Connectez-vous pour envoyer des messages
                  </Typography>
                )}
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
                  <ListItem key={participant.id} sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor: participant.role === 'OWNER' ? 'error.main' :
                          participant.role === 'ADMIN' ? 'primary.main' : 'grey.700'
                      }}>
                        <PersonIcon />
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
                  <Avatar><PersonIcon /></Avatar>
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