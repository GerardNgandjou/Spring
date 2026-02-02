// src/components/common/UserList.tsx (version corrigée)
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  ListItemButton,
  Chip,
  alpha,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'; 
import type { User } from '../../types/oneToOne.type';
import { userApi } from '../../services/api/user';

interface UserListProps {
  currentUserId: number;
  onSelectUser: (user: User) => void;
  existingContacts: User[];
}

const UserList: React.FC<UserListProps> = ({
  currentUserId,
  onSelectUser,
  existingContacts,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await userApi.getAllUsersExceptCurrentUser(currentUserId);
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const isExistingContact = (userId: number) => {
    return existingContacts.some(contact => contact.id === userId);
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60}
            thickness={4}
            sx={{ 
              color: 'primary.main',
              mb: 2,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Chargement des utilisateurs...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Box sx={{ 
        p: 2.5, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        backgroundColor: alpha('#ffffff', 0.7),
      }}>
        <TextField
          fullWidth
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              '&:hover': {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 12px 40px rgba(25, 118, 210, 0.2)',
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        <Fade in={true} timeout={500}>
          <List>
            {filteredUsers.length === 0 ? (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                opacity: 0.7,
              }}>
                <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                </Typography>
              </Box>
            ) : (
              filteredUsers.map((user, index) => {
                const isContact = isExistingContact(user.id);
                const isHovered = hoveredUserId === user.id;
                
                return (
                  <ListItemButton
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    onMouseEnter={() => setHoveredUserId(user.id)}
                    onMouseLeave={() => setHoveredUserId(null)}
                    sx={{
                      borderRadius: '16px',
                      mb: 1,
                      mx: 0.5,
                      p: 2,
                      backgroundColor: isHovered 
                        ? alpha('#ffffff', 0.9)
                        : 'transparent',
                      backdropFilter: isHovered ? 'blur(10px)' : 'none',
                      border: '1px solid',
                      borderColor: isHovered ? 'primary.light' : 'transparent',
                      boxShadow: isHovered 
                        ? '0 8px 32px rgba(0, 0, 0, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: alpha('#ffffff', 0.9),
                        borderColor: 'primary.light',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                        transform: 'translateY(-4px)',
                      }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Avatar
                        sx={{
                          width: 52,
                          height: 52,
                          background: getGradientColor(index),
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 18,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {getInitials(user.email)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {user.email.split('@')[0]}
                          </Typography>

                          {isContact ? (
                            <Chip
                              label="Contact"
                              size="small"
                              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                backgroundColor: alpha('#4caf50', 0.1),
                                color: '#4caf50',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-icon': {
                                  ml: 0.5,
                                }
                              }}
                            />
                          ) : (
                            <Chip
                              label="Nouveau"
                              size="small"
                              sx={{
                                backgroundColor: alpha('#2196f3', 0.1),
                                color: '#2196f3',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            mt: 0.5,
                            fontSize: '0.875rem',
                          }}
                        >
                          {user.email}
                        </Typography>
                      }
                    />

                    <IconButton 
                      size="small"
                      sx={{
                        backgroundColor: isContact 
                          ? alpha('#4caf50', 0.1)
                          : alpha('#2196f3', 0.1),
                        color: isContact ? '#4caf50' : '#2196f3',
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: isContact 
                            ? alpha('#4caf50', 0.2)
                            : alpha('#2196f3', 0.2),
                          transform: 'scale(1.3)',
                        }
                      }}
                    >
                      {isContact ? (
                        <CheckCircleIcon />
                      ) : (
                        <PersonAddIcon />
                      )}
                    </IconButton>
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Fade>
      </Box>
    </Box>
  );
};

export default UserList;