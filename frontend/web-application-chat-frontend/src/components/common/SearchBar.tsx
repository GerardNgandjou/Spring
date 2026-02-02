// src/components/common/SearchBar.tsx
import React, { useState } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  List,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  ListItemButton,
  Fade,
  Chip,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  TagFaces as TagFacesIcon,
} from '@mui/icons-material'; 
import type { Contact, PrivateChatMessage } from '../../types/oneToOne.type';

interface SearchResult {
  type: 'message' | 'contact';
  data: PrivateChatMessage | Contact;
}

interface SearchBarProps {
  messages: PrivateChatMessage[];
  contacts: Contact[];
  currentUserId: number;
  onResultClick: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  messages,
  contacts,
  currentUserId,
  onResultClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchLower = query.toLowerCase();
    
    const messageResults = messages
      .filter(message => 
        message.content.toLowerCase().includes(searchLower) ||
        message.senderName1.toLowerCase().includes(searchLower) ||
        message.senderName2.toLowerCase().includes(searchLower)
      )
      .map(message => ({
        type: 'message' as const,
        data: message,
      }));

    const contactResults = contacts
      .filter(contact =>
        contact.username.toLowerCase().includes(searchLower) ||
        contact.lastMessage?.toLowerCase().includes(searchLower)
      )
      .map(contact => ({
        type: 'contact' as const,
        data: contact,
      }));

    const allResults = [...contactResults, ...messageResults];
    setResults(allResults.slice(0, 10));
    setShowResults(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
    setIsFocused(false);
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    handleClear();
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Box
              key={index}
              component="span"
              sx={{
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
                color: 'primary.main',
                fontWeight: 'bold',
                padding: '0 2px',
                borderRadius: 1,
              }}
            >
              {part}
            </Box>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '50px',
          backgroundColor: theme => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isFocused ? 'primary.main' : 'divider',
          boxShadow: isFocused 
            ? '0 8px 32px rgba(0, 0, 0, 0.1)' 
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        <IconButton 
          sx={{ 
            p: '10px',
            color: isFocused ? 'primary.main' : 'text.secondary'
          }}
        >
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ 
            ml: 1, 
            flex: 1,
            fontSize: '0.95rem',
          }}
          placeholder="Rechercher des messages ou contacts..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {searchQuery && (
          <IconButton 
            onClick={handleClear}
            sx={{
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <ClearIcon />
          </IconButton>
        )}
      </Paper>

      <Fade in={showResults && results.length > 0}>
        <Paper
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            backgroundColor: theme => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme => alpha(theme.palette.primary.main, 0.1),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme => alpha(theme.palette.primary.main, 0.3),
              borderRadius: '4px',
              '&:hover': {
                background: theme => alpha(theme.palette.primary.main, 0.5),
              }
            }
          }}
        >
          <Box sx={{ p: 1 }}>
            <Chip
              label={`${results.length} résultat${results.length > 1 ? 's' : ''}`}
              size="small"
              icon={<TagFacesIcon />}
              sx={{ 
                mb: 1,
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          
          <List sx={{ p: 0 }}>
            {results.map((result, index) => {
              const isContact = result.type === 'contact';
              const contactData = isContact ? result.data as Contact : null;
              const messageData = !isContact ? result.data as PrivateChatMessage : null;
              
              return (
                <React.Fragment key={index}>
                  <ListItemButton
                    onClick={() => handleResultClick(result)}
                    sx={{
                      '&:hover': { 
                        backgroundColor: theme => alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(4px)',
                        transition: 'all 0.2s ease',
                      },
                      borderRadius: '12px',
                      mx: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: isContact 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          color: 'white',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        {isContact
                          ? getInitials(contactData!.username)
                          : getInitials(
                              messageData!.senderId1 === currentUserId
                                ? messageData!.senderName2
                                : messageData!.senderName1
                            )}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isContact ? (
                            <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          ) : (
                            <MessageIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                          )}
                          <Typography variant="subtitle2" fontWeight={600}>
                            {highlightText(
                              isContact
                                ? contactData!.username
                                : messageData!.senderId1 === currentUserId
                                ? messageData!.senderName2
                                : messageData!.senderName1,
                              searchQuery
                            )}
                          </Typography>
                          <Chip
                            label={isContact ? 'Contact' : 'Message'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              backgroundColor: isContact 
                                ? alpha('#667eea', 0.1)
                                : alpha('#f5576c', 0.1),
                              color: isContact ? '#667eea' : '#f5576c',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mt: 0.5,
                            fontSize: '0.875rem',
                          }}
                        >
                          {highlightText(
                            isContact
                              ? contactData!.lastMessage || ''
                              : messageData!.content,
                            searchQuery
                          )}
                        </Typography>
                      }
                    />
                  </ListItemButton>

                  {index < results.length - 1 && (
                    <Divider 
                      sx={{ 
                        mx: 2, 
                        opacity: 0.2,
                      }} 
                    />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      </Fade>
    </Box>
  );
};

export default SearchBar;