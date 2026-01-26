import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { authApi } from '../services/api/auth';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().required('Mot de passe requis'),
});

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // pages/LoginPage.tsx - Version corrigée
  // pages/LoginPage.tsx - Partie onSubmit corrigée
const onSubmit = async (data: { email: string; password: string }) => {
  setLoading(true);
  setError(null);
  
  try {
    // Appel API de login
    const response = await authApi.login(data.email, data.password);
    
    console.log('Login API response:', response.data);
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      
      // Appeler la fonction login du contexte
      login(token, user);
      
      toast.success('Connexion réussie !');
      
      // Récupérer l'URL de redirection depuis l'état
      const from = (location.state as any)?.from || '/chat';
      
      // Rediriger
      navigate(from, { replace: true });
      
    } else {
      setError(response.data.message || 'Échec de la connexion');
      toast.error('Échec de la connexion');
    }
  } catch (error: any) {
    console.error('Login error details:', error);
    
    let errorMessage = 'Erreur de connexion';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    

    <Container component="main" maxWidth="xs">
      {/* // Dans LoginPage.tsx et RegisterPage.tsx */}
      <Button
        variant="text"
        onClick={() => navigate('/')}
        sx={{ mt: 2 }}
      >
        ← Retour à l'accueil
      </Button>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Connexion
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Pas encore de compte ?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary">
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