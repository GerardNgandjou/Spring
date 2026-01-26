// contexts/AuthContext.tsx - VERSION COMPLÈTE CORRIGÉE
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
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAdmin: boolean;
  checkAuth: () => Promise<boolean>;
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

  // Fonction pour vérifier l'authentification
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return false;
    }

    try {
      // Vérifier si le token est valide auprès du backend
      const response = await authApi.getCurrentUser();
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setUser(userData);
        
        // Mettre à jour le localStorage avec les données fraîches
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Configurer l'interceptor avec le token actuel
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return true;
      } else {
        // Token invalide, nettoyer
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // Si erreur 401 (Unauthorized), nettoyer
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
      
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Vérifier l'authentification
        await checkAuth();
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    // Stocker dans localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Mettre à jour l'état
    setUser(userData);
    
    // Configurer l'interceptor axios
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('Login successful, token stored:', token.substring(0, 20) + '...');
  };

  const logout = () => {
    // Appeler l'API logout
    authApi.logout().catch(console.error);
    
    // Nettoyer localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Nettoyer les headers axios
    delete api.defaults.headers.common['Authorization'];
    
    // Mettre à jour l'état
    setUser(null);
    
    console.log('Logout successful');
  };

  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};