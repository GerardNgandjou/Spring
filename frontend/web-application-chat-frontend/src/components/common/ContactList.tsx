// src/components/ContactList.tsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Badge,
  Divider,
  ListItemButton,
  Chip,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Circle as CircleIcon,
  DoneAll as DoneAllIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import type { Contact } from '../../types/oneToOne.type';

interface ContactListProps {
  contacts: Contact[];
  currentUserId: number;
  selectedContactId: number | null;
  onSelectContact: (contactId: number) => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
}) => {
  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm', { locale: fr });
    } else if (isYesterday) {
      return 'Hier';
    }
    return format(date, 'dd/MM', { locale: fr });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      }}
    >
      <List sx={{ p: 0 }}>
        {contacts.map((contact, index) => {
          const isSelected = contact.userId === selectedContactId;
          const hasUnread = contact.unreadCount > 0;
          
          return (
            <React.Fragment key={contact.userId}>
              <ListItem 
                disablePadding
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: isSelected ? '#667eea' : 'transparent',
                    borderTopRightRadius: 4,
                    borderBottomRightRadius: 4,
                    transition: 'background-color 0.3s',
                  }
                }}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelectContact(contact.userId)}
                  sx={{
                    '&:hover': {
                      backgroundColor: hasUnread 
                        ? 'rgba(245, 87, 108, 0.05)' 
                        : 'rgba(0, 0, 0, 0.03)',
                      '&::before': {
                        backgroundColor: hasUnread ? '#f5576c' : '#667eea',
                      }
                    },
                    '&.Mui-selected': {
                      backgroundColor: hasUnread
                        ? 'rgba(245, 87, 108, 0.1)'
                        : 'rgba(102, 126, 234, 0.08)',
                      '&:hover': {
                        backgroundColor: hasUnread
                          ? 'rgba(245, 87, 108, 0.15)'
                          : 'rgba(102, 126, 234, 0.12)',
                      }
                    },
                    px: 2.5,
                    py: 2,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 56 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        contact.online !== undefined ? (
                          <CircleIcon 
                            sx={{ 
                              fontSize: 12, 
                              color: contact.online ? '#4caf50' : '#9e9e9e',
                              filter: contact.online ? 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))' : 'none',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                            }} 
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: hasUnread 
                            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                            : isSelected
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : `hsl(${index * 137.508}, 70%, 50%)`,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 18,
                          boxShadow: hasUnread 
                            ? '0 4px 12px rgba(245, 87, 108, 0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: hasUnread
                              ? '0 6px 16px rgba(245, 87, 108, 0.4)'
                              : '0 6px 16px rgba(0,0,0,0.2)',
                          }
                        }}
                      >
                        {getInitials(contact.username)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack 
                        direction="row" 
                        justifyContent="space-between" 
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography 
                          variant="subtitle1" 
                          noWrap
                          sx={{
                            fontWeight: hasUnread ? 700 : 600,
                            fontSize: '0.95rem',
                            color: hasUnread 
                              ? '#f5576c' 
                              : isSelected 
                              ? '#667eea' 
                              : 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {contact.username}
                          {hasUnread && (
                            <ArrowForwardIcon 
                              sx={{ 
                                fontSize: 14, 
                                color: '#f5576c',
                                animation: 'bounce 1s infinite',
                                '@keyframes bounce': {
                                  '0%, 100%': { transform: 'translateX(0)' },
                                  '50%': { transform: 'translateX(3px)' },
                                }
                              }} 
                            />
                          )}
                        </Typography>

                        <Stack alignItems="flex-end" spacing={0.5}>
                          {contact.lastMessageTime && (
                            <Typography 
                              variant="caption" 
                              sx={{
                                color: hasUnread 
                                  ? '#f5576c' 
                                  : 'text.secondary',
                                fontWeight: hasUnread ? 600 : 400,
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatTime(contact.lastMessageTime)}
                            </Typography>
                          )}
                          
                          {contact.lastMessage && contact.lastMessage.includes('✔') && (
                            <DoneAllIcon 
                              sx={{ 
                                fontSize: 14, 
                                color: contact.lastMessage.includes('✔✔') 
                                  ? '#4caf50' 
                                  : '#9e9e9e' 
                              }} 
                            />
                          )}
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <Stack 
                        direction="row" 
                        justifyContent="space-between" 
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 0.5 }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: hasUnread ? 600 : 400,
                            color: hasUnread
                              ? '#f5576c'
                              : 'text.secondary',
                            fontSize: '0.875rem',
                            flex: 1,
                            fontStyle: !contact.lastMessage ? 'italic' : 'normal',
                            opacity: !contact.lastMessage ? 0.7 : 1,
                          }}
                        >
                          {contact.lastMessage || 'Aucun message'}
                        </Typography>
                        
                        {contact.unreadCount > 0 && (
                          <Chip
                            label={contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            size="small"
                            sx={{
                              backgroundColor: '#f5576c',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              height: 20,
                              minWidth: 20,
                              '& .MuiChip-label': {
                                px: 0.75,
                              }
                            }}
                          />
                        )}
                      </Stack>
                    }
                    sx={{ 
                      ml: 1,
                      '& .MuiListItemText-primary': {
                        mb: 0.5,
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
              
              <Divider 
                variant="inset" 
                component="li" 
                sx={{ 
                  ml: '88px !important',
                  opacity: 0.2,
                }} 
              />
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default ContactList;