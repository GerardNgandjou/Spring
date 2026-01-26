// services/api/api.ts - CONFIGURATION COMPLÈTE
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log pour debug
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    // Log pour debug
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    
    // Si erreur 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing auth...');
      
      // Nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Nettoyer les headers
      delete api.defaults.headers.common['Authorization'];
      
      // Rediriger vers login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;