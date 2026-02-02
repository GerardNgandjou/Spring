// src/components/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  InputAdornment,
  Tooltip,
  Alert,
  Typography,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import type { MessageRequest } from '../../types/oneToOne.type';

interface MessageInputProps {
  onSendMessage: (request: MessageRequest) => void;
  receiverId: number;
  currentUserId: number;
  onTyping?: (isTyping: boolean) => void;
  webSocketConnected?: boolean; // Nouvelle prop
}

const OneToOneMessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  receiverId,
  onTyping,
  webSocketConnected = true, // Nouvelle prop avec valeur par défaut
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDisconnectedWarning, setShowDisconnectedWarning] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleTyping = () => {
    if (!webSocketConnected) {
      setShowDisconnectedWarning(true);
      setTimeout(() => setShowDisconnectedWarning(false), 3000);
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleSend = () => {
    if (!webSocketConnected) {
      setShowDisconnectedWarning(true);
      setTimeout(() => setShowDisconnectedWarning(false), 3000);
      return;
    }

    if (message.trim()) {
      const request: MessageRequest = {
        senderId2: receiverId,
        content: message.trim(),
      };
      onSendMessage(request);
      setMessage('');
      
      if (isTyping) {
        setIsTyping(false);
        onTyping?.(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Avertissement de déconnexion */}
      {showDisconnectedWarning && (
        <Alert 
          severity="warning" 
          icon={<CloudOffIcon />}
          sx={{ 
            mx: 2, 
            mb: 1,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
          }}
        >
          Impossible d'envoyer des messages : connexion WebSocket perdue
        </Alert>
      )}
      
      <Paper
        elevation={0}
        sx={{
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: webSocketConnected ? 'background.paper' : 'grey.50',
          opacity: webSocketConnected ? 1 : 0.7,
          transition: 'opacity 0.3s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip 
            title={webSocketConnected ? "Joindre un fichier" : "Non disponible - WebSocket déconnecté"}
          >
            <span>
              <IconButton 
                color="primary" 
                disabled={!webSocketConnected}
              >
                <AttachFileIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder={
              webSocketConnected 
                ? "Tapez votre message..." 
                : "En attente de reconnexion..."
            }
            variant="outlined"
            size="small"
            disabled={!webSocketConnected}
            sx={{
              mx: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 24,
                '&.Mui-disabled': {
                  backgroundColor: 'action.hover',
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip 
                    title={webSocketConnected ? "Émojis" : "Non disponible - WebSocket déconnecté"}
                  >
                    <span>
                      <IconButton 
                        color="primary" 
                        disabled={!webSocketConnected}
                      >
                        <EmojiEmotionsIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          
          <Tooltip 
            title={
              !webSocketConnected 
                ? "En attente de reconnexion..." 
                : !message.trim() 
                ? "Écrivez un message pour l'envoyer" 
                : "Envoyer le message"
            }
          >
            <span>
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!message.trim() || !webSocketConnected}
                sx={{
                  backgroundColor: webSocketConnected ? 'primary.main' : 'grey.400',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: webSocketConnected ? 'primary.dark' : 'grey.400',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        {/* Indicateur d'état de connexion */}
        {!webSocketConnected && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mt: 1,
            color: 'warning.main'
          }}>
            <CloudOffIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption">
              Reconnexion en cours...
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
};

export default OneToOneMessageInput;