import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  TextField,
  Button,
  Avatar,
  Badge,
  Divider,
  CircularProgress,
  Paper,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Send as SendIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Types temporaires
interface ChatRoom {
  id: number;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participantCount: number;
}

interface Message {
  id: number;
  content: string;
  sender: { id: number; email: string };
  timestamp: string;
}

const drawerWidth = 280;

const ChatPage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: 'Bonjour à tous !', sender: { id: 2, email: 'alice@test.com' }, timestamp: '10:00' },
    { id: 2, content: 'Salut Alice !', sender: { id: 3, email: 'bob@test.com' }, timestamp: '10:01' },
    { id: 3, content: 'Je teste l\'application de chat', sender: { id: user?.id || 1, email: user?.email || 'Vous' }, timestamp: '10:02' },
    { id: 4, content: 'Comment allez-vous ?', sender: { id: 4, email: 'charlie@test.com' }, timestamp: '10:03' },
    { id: 5, content: 'Tout va bien, merci !', sender: { id: user?.id || 1, email: user?.email || 'Vous' }, timestamp: '10:04' },
  ]);
  const [rooms] = useState<ChatRoom[]>([
    { id: 1, name: 'Général', type: 'GROUP', participantCount: 5 },
    { id: 2, name: 'Projet', type: 'GROUP', participantCount: 3 },
    { id: 3, name: 'Aide', type: 'GROUP', participantCount: 2 },
    { id: 4, name: 'Social', type: 'GROUP', participantCount: 8 },
    { id: 5, name: 'Privé', type: 'PRIVATE', participantCount: 2 },
  ]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(rooms[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [roomAnchorEl, setRoomAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRoomForMenu, setSelectedRoomForMenu] = useState<ChatRoom | null>(null);

  // Filtrer les salons par recherche
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (message.trim() && user) {
      const newMessage: Message = {
        id: messages.length + 1,
        content: message,
        sender: { id: user.id, email: user.email },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateRoom = () => {
    const roomName = prompt('Nom du nouveau salon:');
    if (roomName) {
      alert(`Salon "${roomName}" créé (fonctionnalité à implémenter)`);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRoomMenuOpen = (event: React.MouseEvent<HTMLElement>, room: ChatRoom) => {
    setRoomAnchorEl(event.currentTarget);
    setSelectedRoomForMenu(room);
  };

  const handleRoomMenuClose = () => {
    setRoomAnchorEl(null);
    setSelectedRoomForMenu(null);
  };

  const handleRoomSettings = () => {
    if (selectedRoomForMenu) {
      alert(`Paramètres du salon: ${selectedRoomForMenu.name}`);
      handleRoomMenuClose();
    }
  };

  const handleLeaveRoom = () => {
    if (selectedRoomForMenu) {
      if (confirm(`Voulez-vous vraiment quitter le salon "${selectedRoomForMenu.name}" ?`)) {
        alert(`Vous avez quitté le salon "${selectedRoomForMenu.name}"`);
        handleRoomMenuClose();
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {user?.email || 'Utilisateur'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isAdmin ? 'Administrateur' : 'Utilisateur'}
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      {/* Section recherche */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher un salon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />
      
      {/* Liste des salons */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, mb: 1 }}>
          Salons ({filteredRooms.length})
        </Typography>
        
        <List dense>
          {filteredRooms.map((room) => (
            <ListItemButton
              key={room.id}
              selected={selectedRoom?.id === room.id}
              onClick={() => {
                setSelectedRoom(room);
                if (window.innerWidth < 768) {
                  setDrawerOpen(false);
                }
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRoomMenuOpen(e, room);
              }}
            >
              <Avatar 
                sx={{ 
                  mr: 2, 
                  width: 32, 
                  height: 32,
                  bgcolor: room.type === 'PRIVATE' ? 'secondary.main' : 'primary.main'
                }}
              >
                {room.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {room.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {room.participantCount} participant{room.participantCount > 1 ? 's' : ''}
                </Typography>
              </Box>
              {room.participantCount > 0 && (
                <Badge
                  badgeContent={room.participantCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>
      </Box>
      
      {/* Section administration (seulement pour les admins) */}
      {isAdmin && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, mb: 1, mt: 1 }}>
            Administration
          </Typography>
          <List dense>
            <ListItemButton onClick={() => navigate('/admin')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AdminIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Tableau de bord" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/admin/users')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Utilisateurs" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/admin/rooms')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Salons" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
            <ListItemButton onClick={() => navigate('/admin/messages')}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <MessageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Messages" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
          </List>
        </>
      )}
      
      <Divider />
      
      {/* Actions */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateRoom}
          size="small"
          sx={{ mb: 2 }}
        >
          Nouveau salon
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/profile')}
          size="small"
          sx={{ mb: 1 }}
        >
          Mon profil
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="error"
          size="small"
        >
          Déconnexion
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            {selectedRoom && (
              <>
                <Avatar sx={{ mr: 2, bgcolor: selectedRoom.type === 'PRIVATE' ? 'secondary.main' : 'primary.main' }}>
                  {selectedRoom.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" noWrap>
                    {selectedRoom.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {selectedRoom.participantCount} participant{selectedRoom.participantCount > 1 ? 's' : ''} • {selectedRoom.type === 'PRIVATE' ? 'Privé' : 'Public'}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin && (
              <Chip
                label="ADMIN"
                size="small"
                color="secondary"
                sx={{ mr: 1 }}
              />
            )}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="menu utilisateur"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mon profil
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={() => { navigate('/admin'); handleUserMenuClose(); }}>
                  <ListItemIcon>
                    <AdminIcon fontSize="small" />
                  </ListItemIcon>
                  Tableau de bord
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Menu contextuel pour les salons */}
      <Menu
        anchorEl={roomAnchorEl}
        open={Boolean(roomAnchorEl)}
        onClose={handleRoomMenuClose}
      >
        <MenuItem onClick={handleRoomSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Paramètres du salon
        </MenuItem>
        <MenuItem onClick={handleLeaveRoom}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Quitter le salon
        </MenuItem>
      </Menu>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        
        {/* Chat header */}
        {selectedRoom && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: 'background.default',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6">
                # {selectedRoom.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRoom.participantCount} participant{selectedRoom.participantCount > 1 ? 's' : ''} • Salon {selectedRoom.type === 'PRIVATE' ? 'privé' : 'public'}
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={(e) => handleRoomMenuOpen(e, selectedRoom)}
                title="Options du salon"
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Paper>
        )}
        
        {/* Messages container */}
        <Paper
          elevation={0}
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            mb: 2,
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'text.secondary',
              flexDirection: 'column',
            }}>
              <PersonIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6">Aucun message</Typography>
              <Typography variant="body2">Soyez le premier à envoyer un message !</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender.id === user?.id ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  {msg.sender.id !== user?.id && (
                    <Avatar 
                      sx={{ 
                        mr: 1, 
                        alignSelf: 'flex-end', 
                        width: 32, 
                        height: 32,
                        bgcolor: msg.sender.email === 'alice@test.com' ? 'pink.500' :
                                 msg.sender.email === 'bob@test.com' ? 'blue.500' :
                                 msg.sender.email === 'charlie@test.com' ? 'green.500' : 'primary.main'
                      }}
                    >
                      {msg.sender.email.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '70%',
                      backgroundColor: msg.sender.id === user?.id ? 'primary.main' : 'grey.100',
                      color: msg.sender.id === user?.id ? 'white' : 'text.primary',
                      borderRadius: 2,
                      p: 2,
                      position: 'relative',
                      boxShadow: 1,
                    }}
                  >
                    {msg.sender.id !== user?.id && (
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.7, fontWeight: 'medium' }}>
                        {msg.sender.email}
                      </Typography>
                    )}
                    <Typography variant="body1">{msg.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5,
                        opacity: 0.7,
                        color: msg.sender.id === user?.id ? 'white' : 'text.secondary',
                      }}
                    >
                      {msg.timestamp}
                    </Typography>
                  </Box>
                  {msg.sender.id === user?.id && (
                    <Avatar 
                      sx={{ 
                        ml: 1, 
                        alignSelf: 'flex-end', 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {user.email.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Message input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Tapez votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 6,
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            sx={{ 
              minWidth: 56, 
              height: 56,
              borderRadius: '50%',
              minHeight: 56,
            }}
          >
            <SendIcon />
          </Button>
        </Box>
        
        {/* Indicateur en ligne */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                mr: 0.5,
              }} 
            />
            En ligne • {messages.length} message{messages.length > 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;