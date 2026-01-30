// src/pages/LogoutPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Page de déconnexion
 * 
 * Cette page gère le processus de déconnexion complète :
 * 1. Appel API de déconnexion au backend
 * 2. Nettoyage du local storage
 * 3. Réinitialisation du contexte d'authentification
 * 4. Redirection vers la page de connexion
 * 
 * Avantages d'une page dédiée :
 * - Feedback visuel pour l'utilisateur
 * - Gestion robuste des erreurs
 * - Possibilité de log de déconnexion
 * - Redirection contrôlée
 */
const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout, user } = useAuth();
  
  // États pour gérer le processus de déconnexion
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5); // Compte à rebours pour redirection automatique

  /**
   * Fonction principale de déconnexion
   * Gère toute la logique de nettoyage
   */
  const performLogout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Début du processus de déconnexion');
      
      // 1. Appeler la fonction de déconnexion du contexte d'authentification
      // Cette fonction devrait :
      // - Appeler l'API de déconnexion
      // - Supprimer le token du localStorage
      // - Réinitialiser le contexte
      await logout();
      
      // 2. Nettoyage supplémentaire (au cas où)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // 3. Marquer comme succès
      setLogoutSuccess(true);
      
      // 4. Log pour l'admin (en développement)
      if (import.meta.env.DEV) {
        console.log('✅ Déconnexion réussie pour :', user?.email);
      }
      
      // 5. Notification utilisateur
      toast.success('Déconnexion réussie. À bientôt !');
      
      // 6. Lancer le compte à rebours pour redirection automatique
      startCountdown();
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la déconnexion :', error);
      
      let errorMessage = 'Erreur lors de la déconnexion';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // En cas d'erreur, on force quand même le nettoyage local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lance le compte à rebours pour la redirection automatique
   */
  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRedirectToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  };

  /**
   * Redirection vers la page de connexion
   */
  const handleRedirectToLogin = () => {
    navigate('/login', { replace: true });
  };

  /**
   * Redirection vers la page d'accueil
   */
  const handleRedirectToHome = () => {
    navigate('/', { replace: true });
  };

  /**
   * Réessayer la déconnexion en cas d'erreur
   */
  const handleRetry = () => {
    performLogout();
  };

  // Effect pour lancer la déconnexion automatique au chargement de la page
  useEffect(() => {
    // Petit délai pour un meilleur UX (l'utilisateur voit la page)
    const timer = setTimeout(() => {
      performLogout();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        {/* Carte principale */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 4,
            width: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Éléments décoratifs */}
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
              zIndex: 0,
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: `radial-gradient(${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
              zIndex: 0,
            }}
          />

          {/* Contenu principal */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Icône animée */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: loading 
                  ? alpha(theme.palette.warning.main, 0.1)
                  : logoutSuccess 
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                border: `4px solid ${
                  loading 
                    ? alpha(theme.palette.warning.main, 0.3)
                    : logoutSuccess 
                      ? alpha(theme.palette.success.main, 0.3)
                      : alpha(theme.palette.error.main, 0.3)
                }`,
                mb: 4,
                animation: loading ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {loading ? (
                <CircularProgress 
                  size={60} 
                  color="warning"
                  thickness={4}
                />
              ) : logoutSuccess ? (
                <CheckCircleIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.success.main,
                  }}
                />
              ) : (
                <ErrorIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.error.main,
                  }}
                />
              )}
            </Box>

            {/* Titre dynamique */}
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: loading 
                  ? theme.palette.warning.main
                  : logoutSuccess 
                    ? theme.palette.success.main
                    : theme.palette.error.main,
              }}
            >
              {loading ? 'Déconnexion en cours...' : 
               logoutSuccess ? 'Déconnecté !' : 'Erreur de déconnexion'}
            </Typography>

            {/* Message dynamique */}
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              {loading ? (
                'Nous sécurisons votre session et nettoyons vos données...'
              ) : logoutSuccess ? (
                <>
                  Vous avez été déconnecté avec succès.
                  {user?.email && (
                    <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.9em' }}>
                      Compte : {user.email}
                    </Box>
                  )}
                </>
              ) : (
                'Une erreur est survenue lors de la déconnexion.'
              )}
            </Typography>

            {/* Compte à rebours (si succès) */}
            {logoutSuccess && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  mb: 4,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <TimerIcon color="info" />
                <Typography variant="body1" color="info.main">
                  Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {/* Alert d'erreur */}
            {error && (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{
                  mb: 4,
                  borderRadius: 2,
                  textAlign: 'left',
                  alignItems: 'center',
                }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                    startIcon={<RefreshIcon />}
                  >
                    Réessayer
                  </Button>
                }
              >
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Informations de sécurité */}
            <Box
              sx={{
                bgcolor: alpha(theme.palette.grey[200], 0.5),
                p: 3,
                borderRadius: 2,
                mb: 4,
                textAlign: 'left',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: theme.palette.grey[700],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <LogoutIcon fontSize="small" />
                Sécurité de votre session
              </Typography>
              
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Token JWT supprimé
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Données locales nettoyées
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Session invalide côté serveur
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Cookies de session expirés
                  </Typography>
                </li>
              </Box>
            </Box>

            {/* Actions */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
              }}
            >
              {/* Bouton Accueil */}
              <Button
                variant="outlined"
                size="large"
                startIcon={<HomeIcon />}
                onClick={handleRedirectToHome}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
                disabled={loading}
              >
                Page d'accueil
              </Button>

              {/* Bouton Connexion (si succès ou erreur) */}
              {(!loading || error) && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleRedirectToLogin}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    bgcolor: logoutSuccess ? theme.palette.success.main : theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: logoutSuccess ? theme.palette.success.dark : theme.palette.primary.dark,
                    },
                  }}
                >
                  Se reconnecter
                </Button>
              )}
            </Box>

            {/* Lien pour annuler (uniquement pendant le chargement) */}
            {loading && !error && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="text"
                  onClick={handleRedirectToHome}
                  sx={{
                    color: theme.palette.grey[600],
                    fontSize: '0.875rem',
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: theme.palette.grey[800],
                    },
                  }}
                >
                  Annuler la déconnexion
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Informations techniques (développement uniquement) */}
        {import.meta.env.DEV && (
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 3,
              width: '100%',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: theme.palette.info.main,
                fontWeight: 'bold',
                mb: 1,
              }}
            >
              🐛 Informations de débogage
            </Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: theme.palette.grey[600] }}>
              <div>Heure : {new Date().toLocaleTimeString()}</div>
              <div>Session ID : {sessionStorage.getItem('sessionId') || 'N/A'}</div>
              <div>Token présent : {localStorage.getItem('token') ? 'Oui' : 'Non'}</div>
              <div>User : {user?.email || 'N/A'}</div>
              <div>État : {loading ? 'Loading' : logoutSuccess ? 'Success' : 'Error'}</div>
            </Box>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled">
            Votre sécurité est notre priorité
            <br />
            © {new Date().getFullYear()} - Application de chat
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LogoutPage;