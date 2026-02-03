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
  connectionStatus?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  contactName,
  online = false,
  onBack,
  onVideoCall,
  onVoiceCall,
  unreadCount = 0,
  connectionStatus = true,
}) => {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 249, 250, 1) 100%)',
        }
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        {onBack && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
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
          <Avatar 
            sx={{ 
              width: 48,
              height: 48,
              background: online 
                ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                : 'linear-gradient(135deg, #9e9e9e 0%, #616161 100%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 18,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              }
            }}
          >
            {contactName.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" noWrap fontWeight="700" color="#333">
            {contactName}
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ 
                  ml: 1,
                  '& .MuiBadge-badge': {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                      '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                      '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
                    }
                  }
                }}
              />
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography 
              variant="caption" 
              fontWeight="600"
              sx={{
                color: online ? '#4caf50' : '#9e9e9e',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: online ? '#4caf50' : '#9e9e9e',
                  animation: online ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { 
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                      transform: 'scale(1)',
                    },
                    '70%': { 
                      boxShadow: '0 0 0 6px rgba(76, 175, 80, 0)',
                      transform: 'scale(1.1)',
                    },
                    '100%': { 
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                      transform: 'scale(1)',
                    },
                  }
                }}
              />
              {online ? 'En ligne' : 'Hors ligne'}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              ml: 1,
              animation: connectionStatus ? 'fadeIn 0.5s ease' : 'none',
            }}>
              {connectionStatus ? (
                <WifiIcon 
                  fontSize="inherit" 
                  sx={{ 
                    fontSize: 14, 
                    color: '#4caf50',
                    animation: 'wifiPulse 3s infinite',
                    '@keyframes wifiPulse': {
                      '0%, 100%': { opacity: 0.7 },
                      '50%': { opacity: 1 },
                    }
                  }} 
                />
              ) : (
                <WifiOffIcon 
                  fontSize="inherit" 
                  sx={{ 
                    fontSize: 14, 
                    color: '#f44336',
                    animation: 'wifiOffPulse 1.5s infinite',
                    '@keyframes wifiOffPulse': {
                      '0%, 100%': { opacity: 0.3 },
                      '50%': { opacity: 1 },
                    }
                  }} 
                />
              )}
              <Typography 
                variant="caption" 
                fontWeight="600"
                sx={{ 
                  ml: 0.5,
                  color: connectionStatus ? '#4caf50' : '#f44336',
                }}
              >
                {connectionStatus ? 'Connecté' : 'Déconnecté'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            color="inherit" 
            onClick={onVoiceCall}
            disabled={!connectionStatus || !online}
            title={!connectionStatus ? "WebSocket non connecté" : !online ? "Contact hors ligne" : "Appel vocal"}
            sx={{
              background: (connectionStatus && online) 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)'
                : 'rgba(158, 158, 158, 0.1)',
              color: (connectionStatus && online) ? '#4caf50' : '#9e9e9e',
              '&:hover': (connectionStatus && online) ? {
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%)',
                transform: 'scale(1.1)',
              } : {},
              transition: 'all 0.2s ease',
            }}
          >
            <PhoneIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            onClick={onVideoCall}
            disabled={!connectionStatus || !online}
            title={!connectionStatus ? "WebSocket non connecté" : !online ? "Contact hors ligne" : "Appel vidéo"}
            sx={{
              background: (connectionStatus && online) 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : 'rgba(158, 158, 158, 0.1)',
              color: (connectionStatus && online) ? '#667eea' : '#9e9e9e',
              '&:hover': (connectionStatus && online) ? {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                transform: 'scale(1.1)',
              } : {},
              transition: 'all 0.2s ease',
            }}
          >
            <VideocamIcon />
          </IconButton>
          <IconButton 
            color="inherit"
            sx={{
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader;