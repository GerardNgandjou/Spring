// src/components/ChatHeader.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Videocam as VideocamIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';

interface ChatHeaderProps {
  contactName: string;
  online?: boolean;
  onBack?: () => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
  unreadCount?: number;
  connectionStatus?: boolean; // Nouvelle prop
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  contactName,
  online = false,
  onBack,
  onVideoCall,
  onVoiceCall,
  unreadCount = 0,
  connectionStatus = true, // Nouvelle prop avec valeur par défaut
}) => {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {onBack && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color={online ? 'success' : 'default'}
          invisible={!online}
          sx={{ mr: 2 }}
        >
          <Avatar sx={{ bgcolor: online ? 'primary.main' : 'grey.500' }}>
            {contactName.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" noWrap>
            {contactName}
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color={online ? 'success.main' : 'text.secondary'}>
              {online ? 'En ligne' : 'Hors ligne'}
            </Typography>
            {/* Indicateur de connexion WebSocket */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              {connectionStatus ? (
                <WifiIcon fontSize="inherit" color="success" sx={{ fontSize: 14 }} />
              ) : (
                <WifiOffIcon fontSize="inherit" color="error" sx={{ fontSize: 14 }} />
              )}
              <Typography variant="caption" color={connectionStatus ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
                {connectionStatus ? 'Connecté' : 'Déconnecté'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box>
          <IconButton 
            color="inherit" 
            onClick={onVoiceCall}
            disabled={!connectionStatus || !online}
            title={!connectionStatus ? "WebSocket non connecté" : !online ? "Contact hors ligne" : "Appel vocal"}
          >
            <PhoneIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            onClick={onVideoCall}
            disabled={!connectionStatus || !online}
            title={!connectionStatus ? "WebSocket non connecté" : !online ? "Contact hors ligne" : "Appel vidéo"}
          >
            <VideocamIcon />
          </IconButton>
          <IconButton color="inherit">
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader;