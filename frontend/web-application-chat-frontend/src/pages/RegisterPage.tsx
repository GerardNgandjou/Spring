import React, { useState, useEffect } from 'react';
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
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PersonAddOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { authApi } from '../services/api/auth';
import { toast } from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string()
    .min(6, 'Minimum 6 caractères')
    .required('Mot de passe requis'),
  role: yup.string()
    .oneOf(['USER', 'ADMIN'], 'Rôle invalide')
    .default('USER'),
});

type RegisterFormData = {
  email: string;
  password: string;
  role: "USER" | "ADMIN";
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      role: 'USER',
    },
  });

  const email = watch('email');

  // Vérifier la disponibilité de l'email avec debounce
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (email && email.includes('@') && email.length > 3) {
      setCheckingEmail(true);
      
      const timer = setTimeout(async () => {
        try {
          console.log('Checking email:', email);
          const response = await authApi.checkEmail(email);
          console.log('Email check response:', response.data);
          
          // Vérifier la structure de la réponse
          if (response.data) {
            // Si la réponse contient un objet avec 'available'
            if (typeof response.data === 'object' && 'available' in response.data) {
              setEmailAvailable(response.data.available);
            } 
            // Si la réponse est directement un booléen
            else if (typeof response.data === 'boolean') {
              setEmailAvailable(response.data);
            }
            // Si la réponse contient 'data' imbriqué
            else if (response.data.data && typeof response.data.data.available === 'boolean') {
              setEmailAvailable(response.data.data.available);
            } else {
              console.warn('Structure de réponse inattendue:', response.data);
              setEmailAvailable(null);
            }
          } else {
            setEmailAvailable(null);
          }
        } catch (error: any) {
          console.error('Email check error:', error);
          // Si l'API renvoie une erreur 400 (email invalide), traiter comme disponible
          if (error.response?.status === 400) {
            setEmailAvailable(true);
          } else {
            setEmailAvailable(null);
          }
        } finally {
          setCheckingEmail(false);
        }
      }, 800); // 800ms de debounce

      setDebounceTimer(timer);
    } else {
      setEmailAvailable(null);
      setCheckingEmail(false);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [email]);

  const onSubmit = async (data: RegisterFormData) => {
    // Empêcher l'envoi si l'email n'est pas disponible
    if (emailAvailable === false) {
      toast.error('Cet email est déjà utilisé');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(data.email, data.password, data.role);
      
      console.log('Registration response:', response); // Voir toute la réponse
      
      // Vérifier différentes structures de réponse possibles
      if (response.data) {
        // Cas 1: response.data contient un objet avec 'success'
        if (response.data.success) {
          toast.success('Compte créé avec succès !');
          navigate('/login');
        } 
        // Cas 2: response.data est directement l'utilisateur créé
        else if (response.data.id) {
          toast.success('Compte créé avec succès !');
          navigate('/login');
        }
        // Cas 3: Gérer d'autres structures
        else {
          const errorMsg = response.data.message || 'Échec de l\'inscription';
          setError(errorMsg);
        }
      } else {
        // Si response.data est undefined ou vide
        console.warn('Response data is undefined or empty:', response);
        
        // Si la réponse a un statut 200-299, considérer comme succès
        if (response.status >= 200 && response.status < 300) {
          toast.success('Compte créé avec succès !');
          navigate('/login');
        } else {
          setError('Réponse inattendue du serveur');
        }
      }
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = 'Erreur lors de l\'inscription. Veuillez réessayer.';
      
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        
        // Extraire le message d'erreur
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getEmailHelperText = () => {
    if (checkingEmail) {
      return 'Vérification en cours...';
    }
    
    if (errors.email) {
      return errors.email.message;
    }
    
    if (emailAvailable === false) {
      return 'Email déjà utilisé';
    }
    
    if (emailAvailable === true) {
      return 'Email disponible';
    }
    
    return '';
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
            <PersonAddOutlined sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography component="h1" variant="h5" gutterBottom>
            Créer un compte
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setValue('email', e.target.value)}
              error={!!errors.email || emailAvailable === false}
              helperText={getEmailHelperText()}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
                      
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Rôle</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                label="Rôle"
                defaultValue="USER"
                {...register('role')}
                disabled={loading}
              >
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={
                loading || 
                checkingEmail || 
                emailAvailable === false ||
                !email ||
                !watch('password')
              }
            >
              {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary">
                    Se connecter
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Debug info:</strong> Email disponible: {emailAvailable === null ? 'null' : emailAvailable.toString()}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;








// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const RegisterPage: React.FC = () => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   const handleRegister = () => {
//     if (password !== confirmPassword) {
//       alert('Les mots de passe ne correspondent pas');
//       return;
//     }
    
//     // Simuler l'inscription
//     alert('Compte créé avec succès !');
//     navigate('/login');
//   };

//   return (
//     <div style={{
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       height: '100vh',
//       backgroundColor: '#f0f0f0',
//       fontFamily: 'Arial, sans-serif'
//     }}>
//       <div style={{
//         textAlign: 'center',
//         padding: '40px',
//         backgroundColor: 'white',
//         borderRadius: '10px',
//         boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
//         width: '300px'
//       }}>
//         <h2 style={{ color: '#1976d2', marginBottom: '30px' }}>Créer un compte</h2>
        
//         <div style={{ marginBottom: '15px', textAlign: 'left' }}>
//           <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
//             Email
//           </label>
//           <input
//             type="email"
//             placeholder="votre@email.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '10px',
//               border: '1px solid #ddd',
//               borderRadius: '5px',
//               boxSizing: 'border-box'
//             }}
//           />
//         </div>
        
//         <div style={{ marginBottom: '15px', textAlign: 'left' }}>
//           <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
//             Mot de passe
//           </label>
//           <input
//             type="password"
//             placeholder="••••••••"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '10px',
//               border: '1px solid #ddd',
//               borderRadius: '5px',
//               boxSizing: 'border-box'
//             }}
//           />
//         </div>
        
//         <div style={{ marginBottom: '25px', textAlign: 'left' }}>
//           <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
//             Confirmer le mot de passe
//           </label>
//           <input
//             type="password"
//             placeholder="••••••••"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '10px',
//               border: '1px solid #ddd',
//               borderRadius: '5px',
//               boxSizing: 'border-box'
//             }}
//           />
//         </div>
        
//         <button 
//           onClick={handleRegister}
//           style={{
//             width: '100%',
//             padding: '12px',
//             backgroundColor: '#4caf50',
//             color: 'white',
//             border: 'none',
//             borderRadius: '5px',
//             cursor: 'pointer',
//             fontSize: '16px',
//             fontWeight: 'bold'
//           }}
//         >
//           S'inscrire
//         </button>
        
//         <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
//           Déjà un compte ? <span 
//             onClick={() => navigate('/login')}
//             style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
//           >
//             Se connecter
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;