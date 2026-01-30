// src/pages/UnauthorizedPage.tsx
import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Page d'erreur 403 - Accès non autorisé
 * 
 * Cette page s'affiche lorsque :
 * 1. Un utilisateur non authentifié tente d'accéder à une route protégée
 * 2. Un utilisateur authentifié n'a pas les permissions nécessaires (ex: USER essayant d'accéder à /admin)
 * 3. Le token JWT est invalide ou expiré
 */
const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  /**
   * Redirige l'utilisateur vers la page précédente
   * Utilise l'historique du navigateur pour un retour contextuel
   */
  const handleGoBack = () => {
    // Vérifie si l'utilisateur peut revenir en arrière
    if (window.history.length > 1) {
      navigate(-1); // Retour à la page précédente
    } else {
      navigate('/'); // Si pas d'historique, retour à l'accueil
    }
  };

  /**
   * Redirige vers la page d'accueil
   * Option par défaut pour les utilisateurs perdus
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * Redirige vers la page de connexion
   * Utile si l'utilisateur a été déconnecté ou si le token a expiré
   */
  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="md">
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
        {/* Carte principale d'erreur */}
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            width: '100%',
            maxWidth: 600,
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.dark, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Élément décoratif */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(${alpha(theme.palette.error.main, 0.1)} 0%, transparent 70%)`,
              zIndex: 0,
            }}
          />

          {/* Icône principale */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `4px solid ${alpha(theme.palette.error.main, 0.3)}`,
                mb: 3,
              }}
            >
              <SecurityIcon
                sx={{
                  fontSize: 60,
                  color: theme.palette.error.main,
                }}
              />
            </Box>
          </Box>

          {/* Code d'erreur */}
          <Typography
            variant="h1"
            sx={{
              fontSize: '6rem',
              fontWeight: 'bold',
              color: theme.palette.error.main,
              mb: 2,
              lineHeight: 1,
            }}
          >
            403
          </Typography>

          {/* Titre principal */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              color: theme.palette.error.dark,
            }}
          >
            Accès Refusé
          </Typography>

          {/* Message d'explication */}
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
            Vous n'avez pas les autorisations nécessaires pour accéder à cette ressource.
          </Typography>

          {/* Détails supplémentaires (optionnel) */}
          <Box
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.05),
              p: 3,
              borderRadius: 2,
              mb: 4,
              borderLeft: `4px solid ${theme.palette.error.main}`,
              textAlign: 'left',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LockIcon fontSize="small" />
              Cette page est protégée et nécessite :
            </Typography>
            <Box component="ul" sx={{ pl: 4, mb: 0 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Une authentification valide (token JWT)
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Des permissions spécifiques (rôle ADMIN, etc.)
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Un compte actif et vérifié
                </Typography>
              </li>
            </Box>
          </Box>

          {/* Actions possibles */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              mt: 4,
            }}
          >
            {/* Bouton Retour */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                },
              }}
            >
              Retour
            </Button>

            {/* Bouton Accueil */}
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                bgcolor: theme.palette.error.main,
                '&:hover': {
                  bgcolor: theme.palette.error.dark,
                },
              }}
            >
              Page d'accueil
            </Button>
          </Box>

          {/* Lien vers la connexion (si l'utilisateur n'est pas connecté) */}
          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Si vous pensez que c'est une erreur :
            </Typography>
            <Button
              variant="text"
              onClick={handleGoToLogin}
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                '&:hover': {
                  textDecoration: 'none',
                  bgcolor: 'transparent',
                },
              }}
            >
              Se connecter avec un autre compte
            </Button>
          </Box>
        </Paper>

        {/* Informations techniques (debug - visible seulement en développement) */}
        {import.meta.env.DEV && (
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 3,
              width: '100%',
              maxWidth: 600,
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
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <SecurityIcon fontSize="small" />
              Informations de débogage (DEV uniquement)
            </Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              <Typography variant="caption" color="text.secondary">
                • URL actuelle : {window.location.pathname}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                • User Agent : {navigator.userAgent.substring(0, 50)}...
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                • Timestamp : {new Date().toISOString()}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Footer informatif */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled">
            Code d'erreur : 403 Forbidden
            <br />
            Si le problème persiste, contactez l'administrateur du système.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;