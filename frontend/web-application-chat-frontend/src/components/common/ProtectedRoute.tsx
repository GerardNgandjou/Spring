// components/ProtectedRoute.tsx - VERSION CORRIGÉE
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin, checkAuth } = useAuth();
  const location = useLocation();

  // Vérifier périodiquement l'authentification
  useEffect(() => {
    if (!loading && !user) {
      // Vérifier si on a un token mais pas d'utilisateur
      const token = localStorage.getItem('token');
      if (token) {
        checkAuth();
      }
    }
  }, [location.pathname, loading, user, checkAuth]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    // Sauvegarder l'URL actuelle pour redirection après login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Si adminOnly mais pas admin, rediriger vers chat
  if (adminOnly && !isAdmin) {
    return <Navigate to="/chat" replace />;
  }

  // Tout est bon, afficher les enfants
  return <>{children}</>;
};

export default ProtectedRoute;