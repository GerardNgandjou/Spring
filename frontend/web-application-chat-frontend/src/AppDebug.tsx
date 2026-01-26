// components/AuthDebug.tsx
import React from 'react';
import { Paper, Typography, Box, Button, Alert } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  const checkStorage = () => {
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User:', localStorage.getItem('user'));
    console.log('=== AUTH CONTEXT ===');
    console.log('User:', user);
    console.log('Loading:', loading);
    console.log('Is Admin:', isAdmin);
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        Debug Authentication
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>User:</strong> {user ? user.email : 'None'}
        </Typography>
        <Typography variant="body2">
          <strong>Role:</strong> {user?.role}
        </Typography>
        <Typography variant="body2">
          <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" size="small" onClick={checkStorage}>
          Check Storage
        </Button>
        <Button variant="outlined" size="small" onClick={clearStorage}>
          Clear Storage
        </Button>
      </Box>
      
      {!user && localStorage.getItem('token') && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Token exists but user is null. This indicates an auth sync issue.
        </Alert>
      )}
    </Paper>
  );
};

export default AuthDebug;