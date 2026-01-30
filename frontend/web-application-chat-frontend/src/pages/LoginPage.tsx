// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { authApi } from '../services/api/auth';
import { LockOutlined } from '@mui/icons-material';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Alert, 
  TextField, 
  Button, 
  CircularProgress,
  IconButton 
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { login, isAuthenticated, user } = useAuth(); // Ajout de login depuis useAuth
  const navigate = useNavigate();
  const location = useLocation();

  // Rediriger si déjà connecté - À RETIRER ou MODIFIER
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     const from = (location.state as any)?.from?.pathname || '/chat';
  //     navigate(from, { replace: true });
  //   }
  // }, [isAuthenticated, user, navigate, location]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Login attempt with:', formData.email);
      
      const response = await authApi.login(formData.email, formData.password);
      
      console.log('Login API response:', response.data);
      
      if (response.data.success) {
        // const { token, user } = response.data.data;
        
        // OPTION 1: Utiliser la fonction login du AuthContext (RECOMMANDÉ)
        await login(formData.email, formData.password); // Cette fonction devrait gérer le stockage et la redirection
        
        // OPTION 2: Si login du AuthContext ne fonctionne pas, faites manuellement :
        // localStorage.setItem('token', token);
        // localStorage.setItem('user', JSON.stringify(user));
        // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success('Connexion réussie !');
        
        // Rediriger vers la page demandée ou par défaut
        const from = (location.state as any)?.from || '/chat';
        navigate(from, { replace: true });
        
      } else {
        const errorMsg = response.data.message || 'Échec de la connexion';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.response?.status === 403) {
        errorMessage = 'Compte désactivé';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Pour les tests rapides
  const fillTestCredentials = (role: 'user' | 'admin') => {
    const credentials = {
      user: { email: 'user@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'admin123' }
    };
    setFormData(credentials[role]);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 2, mb: 1 }}>
        <IconButton onClick={() => navigate('/')}>
          <ArrowBack />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Retour à l'accueil
          </Typography>
        </IconButton>
      </Box>
      
      <Box sx={{ 
        marginTop: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ 
            backgroundColor: 'primary.main',
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            margin: '0 auto'
          }}>
            <LockOutlined sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
            Connexion
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Boutons de test rapide (à retirer en production) */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => fillTestCredentials('user')}
            >
              Test User
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => fillTestCredentials('admin')}
            >
              Test Admin
            </Button>
          </Box>
          
          <Box component="form" onSubmit={onSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
              disabled={loading}
              error={!!error && error.includes('email')}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              error={!!error && error.includes('mot de passe')}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1rem'
              }}
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Se connecter'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Pas encore de compte ?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ fontWeight: 500 }}>
                    S'inscrire
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;