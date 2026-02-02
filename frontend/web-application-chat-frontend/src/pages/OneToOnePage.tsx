// src/pages/OneToOnePage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Drawer,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Snackbar,
  Typography,
  IconButton,
  Tab,
  Tabs,
  alpha,
  Badge,
  Fade,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import ChatHeader from '../components/common/ChatHeader';
import ContactList from '../components/common/ContactList';
import TypingIndicator from '../components/common/TypingIndicator';
import type { Contact, PrivateChatMessage, MessageRequest, User } from '../types/oneToOne.type';
import { oneToOneApi } from '../services/api/oneToOneApi';
import OneToOneMessage from '../components/common/OneToOneMessage';
import OneToOneMessageInput from '../components/common/OneToOneMessageInput';
import UserList from '../components/common/UserList';
import SearchBar from '../components/common/SearchBar';
import { chatWebSocket } from '../services/chatWebsocket';

// Constantes
const DRAWER_WIDTH = 360;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${DRAWER_WIDTH}px`,
  width: `calc(100% + ${DRAWER_WIDTH}px)`,
  ...(open && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const GlassDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    backdropFilter: 'blur(20px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.85),
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
}));

const FloatingHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const GradientTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px 4px 0 0',
    height: 3,
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    minHeight: 48,
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const MessageArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(3, 4),
  background: 'radial-gradient(circle at 50% 0%, rgba(120, 119, 198, 0.1) 0%, rgba(255, 255, 255, 0) 50%)',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.primary.main, 0.1),
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: '4px',
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.5),
    },
  },
}));

const OneToOnePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [searchMode, setSearchMode] = useState(false);
  
  // États
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<PrivateChatMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const [webSocketConnected, setWebSocketConnected] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Récupérer l'ID de l'utilisateur courant
  const getCurrentUserId = (): number => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || 1;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return 1;
      }
    }
    return 1;
  };
  
  const [currentUserId, setCurrentUserId] = useState<number>(getCurrentUserId());
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Charger les contacts
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
      
      const response = await oneToOneApi.getUserContacts(userId);
      // Ajouter un statut online simulé pour le design
      const contactsWithOnline = response.data.map(contact => ({
        ...contact,
        online: Math.random() > 0.5, // À remplacer par votre logique réelle
      }));
      setContacts(contactsWithOnline);
      
      // Sélectionner le premier contact par défaut
      if (response.data.length > 0 && !selectedContact) {
        setSelectedContact(contactsWithOnline[0]);
      }
      
      // Cacher le message de bienvenue après le chargement
      setTimeout(() => setShowWelcome(false), 2000);
    } catch (err: any) {
      setError('Erreur lors du chargement des contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedContact]);
  
  // Charger les messages avec un contact
  const loadMessages = useCallback(async (contactId: number) => {
    try {
      const userId = getCurrentUserId();
      const response = await oneToOneApi.getChatBetweenUsers(userId, contactId);
      setMessages(response.data);
      
      // Faire défiler vers le bas après le chargement
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      console.error(err);
    }
  }, []);
  
  // Envoyer un message
  const handleSendMessage = async (request: MessageRequest) => {
    if (!selectedContact) return;
    
    try {
      const userId = getCurrentUserId();
      const response = await oneToOneApi.sendMessage(userId, request);
      
      // Ajouter le message à la liste
      setMessages(prev => [...prev, response.data]);
      
      // Mettre à jour le dernier message dans la liste des contacts
      setContacts(prev =>
        prev.map(contact =>
          contact.userId === selectedContact.userId
            ? {
                ...contact,
                lastMessage: response.data.content,
                lastMessageTime: response.data.timestamp,
                online: true,
              }
            : contact
        )
      );
      
      // Faire défiler vers le bas
      scrollToBottom();
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
      console.error(err);
    }
  };
  
  // Marquer les messages comme lus
  const markMessagesAsRead = useCallback(async () => {
    if (!selectedContact) return;
    
    const unreadMessages = messages.filter(
      msg => msg.senderId1 === selectedContact.userId && !msg.isRead
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      
      try {
        const userId = getCurrentUserId();
        await oneToOneApi.markMessagesAsRead(userId, { messageIds });
        
        // Mettre à jour les messages localement
        setMessages(prev =>
          prev.map(msg =>
            messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          )
        );
        
        // Mettre à jour le compteur dans les contacts
        setContacts(prev =>
          prev.map(contact =>
            contact.userId === selectedContact.userId
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        );
      } catch (err) {
        console.error('Erreur lors du marquage des messages comme lus:', err);
      }
    }
  }, [messages, selectedContact]);
  
  // Faire défiler vers le bas
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };
  
  // Gérer la sélection d'un contact
  const handleSelectContact = (contactId: number) => {
    const contact = contacts.find(c => c.userId === contactId);
    if (contact) {
      setSelectedContact(contact);
      loadMessages(contactId);
      
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };
  
  // Gérer la sélection d'un utilisateur (pour nouvelle conversation)
  const handleSelectUser = (user: User) => {
    // Vérifier si une conversation existe déjà
    const existingContact = contacts.find(c => c.userId === user.id);
    
    if (existingContact) {
      // Sélectionner le contact existant
      setSelectedContact(existingContact);
      loadMessages(user.id);
    } else {
      // Créer un nouveau contact
      const newContact: Contact = {
        userId: user.id,
        username: user.email,
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: 0,
        online: true,
      };
      
      setContacts(prev => [...prev, newContact]);
      setSelectedContact(newContact);
      setMessages([]); // Pas encore de messages
    }
    
    if (isMobile) {
      setMobileOpen(false);
    }
    
    // Revenir à l'onglet des discussions
    setActiveTab('chats');
  };
  
  // Gérer l'indicateur de frappe
  const handleTyping = (typing: boolean) => {
    if (selectedContact) {
      const userId = getCurrentUserId();
      chatWebSocket.sendPrivateTypingNotification(userId, selectedContact.userId, typing);
    }
  };
  
  // Gérer le résultat de recherche
  const handleSearchResultClick = (result: any) => {
    if (result.type === 'contact') {
      handleSelectContact(result.data.userId);
    } else if (result.type === 'message') {
      const message = result.data;
      const userId = getCurrentUserId();
      const contactId = message.senderId1 === userId ? message.senderId2 : message.senderId1;
      handleSelectContact(contactId);
    }
  };
  
  // Configuration WebSocket
  useEffect(() => {
    const userId = getCurrentUserId();
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found in localStorage');
      return;
    }
    
    // Configurer les callbacks WebSocket
    const connectionUnsubscribe = chatWebSocket.onConnectionChange((connected) => {
      setWebSocketConnected(connected);
      console.log(`WebSocket connection: ${connected ? 'connected' : 'disconnected'}`);
    });
    
    const errorUnsubscribe = chatWebSocket.onError((errorMessage) => {
      setError(`Erreur WebSocket: ${errorMessage}`);
      console.error('WebSocket error:', errorMessage);
    });
    
    // S'abonner aux messages privés du contact sélectionné
    let privateMessageUnsubscribe: () => void = () => {};
    
    if (selectedContact) {
      privateMessageUnsubscribe = chatWebSocket.onPrivateMessage(
        selectedContact.userId,
        (message) => {
          console.log('Private message received from service:', message);
          
          // Ajouter le message à la liste
          setMessages(prev => [...prev, message]);
          
          // Mettre à jour le dernier message dans les contacts
          setContacts(prev =>
            prev.map(contact =>
              contact.userId === selectedContact.userId
                ? {
                    ...contact,
                    lastMessage: message.content,
                    lastMessageTime: message.timestamp,
                    unreadCount: contact.userId === selectedContact.userId ? 0 : contact.unreadCount + 1,
                    online: true,
                  }
                : contact
            )
          );
          
          scrollToBottom();
        }
      );
    }
    
    // S'abonner aux notifications de frappe du contact sélectionné
    let privateTypingUnsubscribe: () => void = () => {};
    
    if (selectedContact) {
      privateTypingUnsubscribe = chatWebSocket.onPrivateTyping(
        selectedContact.userId,
        (data) => {
          setIsTyping(data.isTyping);
          setTypingUser(data.username);
        }
      );
    }
    
    // Se connecter au WebSocket
    chatWebSocket.connect(token, userId);
    
    return () => {
      // Nettoyer les abonnements
      connectionUnsubscribe();
      errorUnsubscribe();
      privateMessageUnsubscribe();
      privateTypingUnsubscribe();
    };
  }, [selectedContact]);
  
  // Chargement initial
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);
  
  // Charger les messages quand un contact est sélectionné
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.userId);
      markMessagesAsRead();
    }
  }, [selectedContact, loadMessages, markMessagesAsRead]);
  
  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    if (!isMobile) {
      setDrawerOpen(!drawerOpen);
    }
  };
  
  const handleDrawerClose = () => {
    setMobileOpen(false);
  };
  
  if (loading && !selectedContact) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Fade in={loading}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{ 
                color: 'white',
                mb: 3,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                }
              }} 
            />
            <Typography variant="h6" color="white" fontWeight="600">
              Chargement des conversations...
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mt: 1 }}>
              Préparation de votre espace de discussion
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      {/* Drawer pour la liste des contacts */}
      <GlassDrawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? mobileOpen : drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <FloatingHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{
                display: { xs: 'flex', md: 'none' },
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="700">
              Messages
            </Typography>
            <Badge
              badgeContent={contacts.reduce((sum, contact) => sum + contact.unreadCount, 0)}
              color="error"
              sx={{ ml: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={() => setSearchMode(!searchMode)}
              sx={{
                backgroundColor: searchMode ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <SearchIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', color: webSocketConnected ? '#4caf50' : '#f44336' }}>
              {webSocketConnected ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
            </Box>
          </Box>
        </FloatingHeader>
        
        {/* Onglets */}
        <Box sx={{ px: 2, pt: 2 }}>
          <GradientTabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChatIcon fontSize="small" />
                  <span>Discussions</span>
                  <Box
  sx={{
    ml: 1,
    minWidth: 20,
    height: 20,
    px: 0.8,
    borderRadius: '10px',
    backgroundColor: 'error.main',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {contacts.reduce((sum, c) => sum + c.unreadCount, 0)}
</Box>

                </Box>
              } 
              value="chats" 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon fontSize="small" />
                  <span>Nouveau</span>
                </Box>
              } 
              value="users" 
            />
          </GradientTabs>
        </Box>
        
        {/* Barre de recherche */}
        {searchMode && activeTab === 'chats' && (
          <Box sx={{ p: 2, pt: 1 }}>
            <SearchBar
              messages={messages}
              contacts={contacts}
              currentUserId={currentUserId}
              onResultClick={handleSearchResultClick}
            />
          </Box>
        )}
        
        {/* Compteur de contacts */}
        {!searchMode && activeTab === 'chats' && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} 
              {contacts.some(c => c.online) && ` • ${contacts.filter(c => c.online).length} en ligne`}
            </Typography>
          </Box>
        )}
        
        {/* Contenu principal du drawer */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'chats' ? (
            <ContactList
              contacts={contacts}
              currentUserId={currentUserId}
              selectedContactId={selectedContact?.userId || null}
              onSelectContact={handleSelectContact}
            />
          ) : (
            <UserList
              currentUserId={currentUserId}
              onSelectUser={handleSelectUser}
              existingContacts={contacts.map(contact => ({
                id: contact.userId,
                email: contact.username,
              }))}
            />
          )}
        </Box>
      </GlassDrawer>
      
      {/* Zone de chat principale */}
      <Main open={drawerOpen}>
        {selectedContact ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* En-tête du chat */}
            <ChatHeader
              contactName={selectedContact.username}
              onBack={isMobile ? handleDrawerToggle : undefined}
              unreadCount={selectedContact.unreadCount}
              connectionStatus={webSocketConnected}
              online={selectedContact.online}
              onVideoCall={() => console.log('Video call clicked')}
              onVoiceCall={() => console.log('Voice call clicked')}
            />
            
            {/* Zone des messages */}
            <MessageArea ref={messagesContainerRef}>
              {showWelcome && (
                <Fade in={showWelcome}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" color="primary" fontWeight="600" gutterBottom>
                      👋 Bienvenue dans votre chat !
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commencez à discuter avec {selectedContact.username}
                    </Typography>
                  </Paper>
                </Fade>
              )}
              
              {messages.map((message) => (
                <OneToOneMessage
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                />
              ))}
              
              <TypingIndicator
                isTyping={isTyping}
                userName={typingUser}
              />
              
              <div ref={messagesEndRef} />
            </MessageArea>
            
            {/* Input pour écrire des messages */}
            <Box sx={{ 
              p: 2, 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backdropFilter: 'blur(10px)',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
            }}>
              <OneToOneMessageInput
                onSendMessage={handleSendMessage}
                receiverId={selectedContact.userId}
                currentUserId={currentUserId}
                onTyping={handleTyping}
                webSocketConnected={webSocketConnected}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Fade in={true}>
              <Box sx={{ maxWidth: 480 }}>
                <Typography 
                  variant="h2" 
                  fontWeight="800" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 3,
                  }}
                >
                  Chat Privé
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    opacity: 0.9,
                    fontWeight: 400,
                  }}
                >
                  Sélectionnez une conversation pour commencer à discuter
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 4, 
                    opacity: 0.7,
                  }}
                >
                  Ou créez une nouvelle conversation depuis l'onglet "Nouveau"
                </Typography>
                
                {!webSocketConnected && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: alpha('#ff9800', 0.2),
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    Connexion WebSocket en cours...
                  </Alert>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mt: 4,
                  justifyContent: 'center',
                }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                    flex: 1,
                  }}>
                    <ChatIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">
                      {contacts.length} discussion{contacts.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                    flex: 1,
                  }}>
                    <PersonAddIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">
                      Nouveaux contacts
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Box>
        )}
      </Main>
      
      {/* Snackbar pour les erreurs */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            backdropFilter: 'blur(20px)',
            backgroundColor: alpha(theme.palette.error.main, 0.9),
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OneToOnePage;