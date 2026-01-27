// contexts/AuthContext.tsx - VERSION COMPLÈTE ET FONCTIONNELLE
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../services/api/auth';
import api from '../services/api/api';

interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialiser l'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Vérifier si le token est valide
          const response = await authApi.getCurrentUser();
          
          if (response.data.success) {
            // Token valide, mettre à jour l'utilisateur
            const freshUserData = response.data.data;
            setUser(freshUserData);
            
            // Mettre à jour le localStorage avec les données fraîches
            localStorage.setItem('user', JSON.stringify(freshUserData));
            
            console.log('User authenticated from localStorage:', freshUserData.email);
          } else {
            // Token invalide, nettoyer
            console.log('Invalid token, clearing storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Fonction de connexion
  const login = async (token: string, userData: User): Promise<void> => {
    return new Promise((resolve) => {
      // Stocker dans localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Configurer l'interceptor axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Mettre à jour l'état
      setUser(userData);
      
      console.log('Login successful:', userData.email);
      resolve();
    });
  };

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        // Appeler l'API logout
        authApi.logout();
      } catch (error) {
        console.error('Logout API error:', error);
      }
      
      // Nettoyer localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Nettoyer les headers axios
      delete api.defaults.headers.common['Authorization'];
      
      // Mettre à jour l'état
      setUser(null);
      
      console.log('Logout successful');
      resolve();
    });
  };

  // Mettre à jour l'utilisateur
  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};