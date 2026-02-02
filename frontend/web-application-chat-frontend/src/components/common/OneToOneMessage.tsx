// src/components/ChatMessage.tsx
import React from 'react';
import { Box, Typography, Paper, Avatar, Tooltip, Fade } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { PrivateChatMessage } from '../../types/oneToOne.type';

interface ChatMessageProps {
  message: PrivateChatMessage;
  currentUserId: number;
}

const OneToOneMessage: React.FC<ChatMessageProps> = ({ message, currentUserId }) => {
  const isOwnMessage = message.senderId1 === currentUserId;
  const messageDate = new Date(message.timestamp);
  const isRecent = Date.now() - messageDate.getTime() < 60000; // Moins d'une minute
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Définition de couleurs avec un meilleur contraste
  const ownMessageStyle = {
    background: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)', // Bleu Apple avec plus de contraste
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 122, 255, 0.3)',
  };

  const otherMessageStyle = {
    background: '#FFFFFF',
    color: '#1D1D1F', // Gris foncé pour un meilleur contraste
    border: '1px solid #E5E5EA',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  };

  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2.5,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            maxWidth: { xs: '90%', sm: '75%', md: '65%' },
            gap: 1.5,
            width: '100%',
          }}
        >
          {/* Avatar - seulement pour les messages de l'autre personne */}
          {!isOwnMessage && (
            <Tooltip 
              title={message.senderName1 || 'Utilisateur'} 
              placement="top"
              arrow
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.3s ease',
                  }
                }}
              >
                {getInitials(message.senderName1 || 'Utilisateur')}
              </Avatar>
            </Tooltip>
          )}
          
          {/* Message container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
              flex: 1,
              minWidth: 0, // Important pour éviter les débordements
            }}
          >
            {/* Nom de l'expéditeur (seulement pour les messages des autres) */}
            {!isOwnMessage && (
              <Typography
                variant="caption"
                sx={{
                  color: '#6D6D72',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  mb: 0.5,
                  ml: 1,
                }}
              >
                {message.senderName1 || 'Utilisateur'}
              </Typography>
            )}
            
            {/* Message bubble */}
            <Box
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 8,
                  [isOwnMessage ? 'right' : 'left']: -6,
                  width: 12,
                  height: 12,
                  backgroundColor: isOwnMessage ? '#007AFF' : '#FFFFFF',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                  transform: isOwnMessage ? 'rotate(45deg)' : 'rotate(-45deg)',
                  display: { xs: 'none', sm: 'block' }, // Cacher sur mobile pour économiser de l'espace
                }
              }}
            >
              <Paper
                elevation={isRecent ? 3 : 1}
                sx={{
                  p: 2,
                  borderRadius: isOwnMessage 
                    ? '18px 18px 4px 18px' // Coins arrondis à droite pour messages propres
                    : '18px 18px 18px 4px', // Coins arrondis à gauche pour messages reçus
                  ...(isOwnMessage ? ownMessageStyle : otherMessageStyle),
                  position: 'relative',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isOwnMessage
                      ? '0 8px 32px rgba(0, 122, 255, 0.4)'
                      : '0 8px 28px rgba(0, 0, 0, 0.12)',
                  },
                  wordBreak: 'break-word', // Assure que les mots longs cassent correctement
                  overflowWrap: 'break-word', // Support supplémentaire pour le retour à la ligne
                  maxWidth: '100%',
                }}
              >
                {isRecent && !isOwnMessage && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#FF3B30',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                      }
                    }}
                  >
                    !
                  </Box>
                )}
                
                {/* Contenu du message */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    fontWeight: 400,
                    color: 'inherit',
                    whiteSpace: 'pre-wrap', // Préserve les sauts de ligne
                  }}
                >
                  {message.content}
                </Typography>
                
                {/* Métadonnées du message */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mt: 1.5,
                    gap: 1,
                  }}
                >
                  <Tooltip 
                    title={format(messageDate, 'PPpp', { locale: fr })} 
                    placement="top"
                    arrow
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ 
                        fontSize: 12, 
                        color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' 
                      }} />
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.8,
                          fontSize: '0.7rem',
                          color: isOwnMessage ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)',
                          fontWeight: 500,
                        }}
                      >
                        {format(messageDate, 'HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  </Tooltip>
                  
                  {isOwnMessage && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      {message.isRead ? (
                        <Tooltip title="Lu" arrow>
                          <DoneAllIcon 
                            sx={{ 
                              fontSize: 16, 
                              color: isOwnMessage ? '#FFFFFF' : '#4caf50',
                              opacity: isOwnMessage ? 0.9 : 1,
                            }} 
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Envoyé" arrow>
                          <DoneIcon 
                            sx={{ 
                              fontSize: 16, 
                              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                            }} 
                          />
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
          
          {/* Avatar pour vos propres messages (optionnel, à droite) */}
          {isOwnMessage && (
            <Tooltip 
              title="Vous" 
              placement="top"
              arrow
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.3s ease',
                  }
                }}
              >
                {getInitials(message.senderName1 || 'Moi')}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default OneToOneMessage;