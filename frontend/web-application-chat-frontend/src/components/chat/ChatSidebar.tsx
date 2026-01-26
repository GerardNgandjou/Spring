import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Group as GroupIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ExitToApp as ExitToAppIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatRoomResponse } from '../../types';

interface ChatSidebarProps {
  rooms: ChatRoomResponse[];
  selectedRoom: ChatRoomResponse | null;
  onRoomSelect: (room: ChatRoomResponse) => void;
  onCreateRoom: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  onCreateRoom,
  onLogout,
  onProfileClick,
  onSettingsClick,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roomMenuAnchor, setRoomMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMenuRoom, setSelectedMenuRoom] = useState<ChatRoomResponse | null>(null);

  // Filtrer les salons
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gérer le menu contextuel des salons
  const handleRoomMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    room: ChatRoomResponse
  ) => {
    event.stopPropagation();
    setRoomMenuAnchor(event.currentTarget);
    setSelectedMenuRoom(room);
  };

  const handleRoomMenuClose = () => {
    setRoomMenuAnchor(null);
    setSelectedMenuRoom(null);
  };

  const handleLeaveRoom = () => {
    if (selectedMenuRoom) {
      // Implémenter la logique pour quitter le salon
      console.log('Leaving room:', selectedMenuRoom.id);
      handleRoomMenuClose();
    }
  };

  const handleMuteRoom = () => {
    if (selectedMenuRoom) {
      // Implémenter la logique pour mute le salon
      console.log('Muting room:', selectedMenuRoom.id);
      handleRoomMenuClose();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header avec infos utilisateur */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color="success"
          >
            <Avatar
              sx={{ width: 40, height: 40, cursor: 'pointer' }}
              onClick={onProfileClick}
            >
              {user?.email.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box flex={1}>
            <Typography variant="subtitle1" noWrap>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              En ligne
            </Typography>
          </Box>
          <Tooltip title="Paramètres">
            <IconButton size="small" onClick={onSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Barre de recherche */}
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
            sx: { borderRadius: 2 },
          }}
        />
      </Box>

      {/* Bouton créer un salon */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateRoom}
          sx={{ borderRadius: 2 }}
        >
          Nouveau salon
        </Button>
      </Box>

      <Divider />

      {/* Liste des salons */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List disablePadding>
          <ListItem sx={{ px: 2, py: 1 }}>
            <ListItemText
              primary={
                <Typography variant="subtitle2" color="text.secondary">
                  SALONS ({filteredRooms.length})
                </Typography>
              }
            />
          </ListItem>

          {filteredRooms.map((room) => (
            <ListItemButton
              key={room.id}
              selected={selectedRoom?.id === room.id}
              onClick={() => onRoomSelect(room)}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor:
                      room.type === 'PRIVATE'
                        ? 'secondary.main'
                        : 'primary.main',
                  }}
                >
                  {room.type === 'PRIVATE' ? (
                    <PersonIcon fontSize="small" />
                  ) : (
                    <GroupIcon fontSize="small" />
                  )}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" noWrap>
                    {room.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {room.participantCount} participant
                    {room.participantCount > 1 ? 's' : ''}
                  </Typography>
                }
              />
              <IconButton
                size="small"
                onClick={(e) => handleRoomMenuOpen(e, room)}
                sx={{ opacity: 0.7 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))}

          {filteredRooms.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Aucun salon trouvé
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Essayez un autre terme de recherche
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* Menu contextuel des salons */}
      <Menu
        anchorEl={roomMenuAnchor}
        open={Boolean(roomMenuAnchor)}
        onClose={handleRoomMenuClose}
      >
        <MenuItem onClick={handleMuteRoom}>
          <ListItemIcon>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mettre en sourdine</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLeaveRoom}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            <Typography color="error">Quitter le salon</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Footer avec actions globales */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
        <List disablePadding>
          <ListItemButton
            onClick={onProfileClick}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Mon profil" />
          </ListItemButton>
          <ListItemButton
            onClick={onLogout}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <ExitToAppIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
};

export default ChatSidebar;