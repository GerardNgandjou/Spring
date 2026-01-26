// pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  Chip,
  Avatar,
  alpha,
  useTheme,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  Chat as ChatIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  RocketLaunch as RocketLaunchIcon,
  ArrowForward as ArrowForwardIcon,
  Message as MessageIcon,
  Groups as GroupsIcon,
  Shield as ShieldIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/api/chat';
import { userApi } from '../services/api/user';
import { toast } from 'react-hot-toast';
// import Grid from '@mui/material'; // <-- IMPORTEZ Grid2 ICI


interface HomeStats {
  totalUsers?: number;
  totalRooms?: number;
  activeRooms?: number;
  recentActivity?: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<HomeStats>({});
  const [loading, setLoading] = useState(true);
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        // Charger les statistiques publiques
        const [roomsResponse, usersResponse] = await Promise.allSettled([
          chatApi.getRooms(),
          userApi.getAllUsers(),
        ]);

        const rooms = roomsResponse.status === 'fulfilled' ? roomsResponse.value.data || [] : [];
        const users = usersResponse.status === 'fulfilled' ? usersResponse.value.data.data || [] : [];

        // Calculer les statistiques
        const activeRooms = rooms.filter((room: any) => room.participantCount > 0).length;
        
        setStats({
          totalUsers: users.length,
          totalRooms: rooms.length,
          activeRooms,
          recentActivity: Math.floor(Math.random() * 100) + 50, // Simulation
        });

        // Salons populaires (top 3 par participants)
        const popularRooms = [...rooms]
          .sort((a: any, b: any) => b.participantCount - a.participantCount)
          .slice(0, 3);
        
        setFeaturedRooms(popularRooms);

      } catch (error) {
        console.error('Error loading home data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const features = [
    {
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      title: 'Chat en temps réel',
      description: 'Discutez instantanément avec WebSocket',
      color: theme.palette.primary.main,
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Salons multiples',
      description: 'Rejoignez différents salons publics ou privés',
      color: theme.palette.secondary.main,
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 40 }} />,
      title: 'Sécurité avancée',
      description: 'Authentification JWT et chiffrement',
      color: theme.palette.success.main,
    },
    {
      icon: <BoltIcon sx={{ fontSize: 40 }} />,
      title: 'Performant',
      description: 'Interface rapide et réactive',
      color: theme.palette.warning.main,
    },
  ];

  const statsCards = [
    {
      label: 'Utilisateurs actifs',
      value: stats.totalUsers || '...',
      icon: <PeopleIcon />,
      color: '#1976d2',
    },
    {
      label: 'Salons de chat',
      value: stats.totalRooms || '...',
      icon: <ChatIcon />,
      color: '#9c27b0',
    },
    {
      label: 'Salons actifs',
      value: stats.activeRooms || '...',
      icon: <TrendingUpIcon />,
      color: '#4caf50',
    },
    {
      label: 'Messages aujourd\'hui',
      value: stats.recentActivity || '...',
      icon: <MessageIcon />,
      color: '#ff9800',
    },
  ];

  const heroSection = (
    <Paper
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        borderRadius: 4,
        p: { xs: 3, md: 6 },
        mb: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          Bienvenue sur{' '}
          <Box component="span" sx={{ color: theme.palette.secondary.light }}>
            ChatApp Pro
          </Box>
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          La plateforme de messagerie moderne pour communiquer efficacement
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {user ? (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/chat')}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                  },
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Accéder au chat
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/admin')}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha('#fff', 0.1),
                    },
                  }}
                >
                  Tableau de bord Admin
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                  },
                }}
              >
                Se connecter
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: alpha('#fff', 0.1),
                  },
                }}
              >
                S'inscrire gratuitement
              </Button>
            </>
          )}
        </Stack>
      </Box>
      
      {/* Éléments décoratifs */}
      <Box
        sx={{
          position: 'absolute',
          right: -50,
          top: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 100,
          bottom: -100,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: alpha('#fff', 0.05),
        }}
      />
    </Paper>
  );

  const featuresSection = (
    <Box sx={{ mb: 8 }}>
      <Typography variant="h3" textAlign="center" gutterBottom>
        Fonctionnalités principales
      </Typography>
      <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
        Découvrez tout ce que notre plateforme offre
      </Typography>
      
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 3,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(feature.color, 0.1),
                  color: feature.color,
                  mb: 3,
                }}
              >
                {feature.icon}
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {feature.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const statsSection = (
    <Box sx={{ mb: 8 }}>
      <Typography variant="h3" textAlign="center" gutterBottom>
        Notre communauté en chiffres
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(stat.color, 0.1),
                  color: stat.color,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {stat.icon}
              </Box>
              
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                {stat.value}
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                {stat.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const featuredRoomsSection = featuredRooms.length > 0 && (
    <Box sx={{ mb: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">
          Salons populaires
        </Typography>
        <Button
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/chat')}
        >
          Voir tous les salons
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {featuredRooms.map((room) => (
          <Grid item xs={12} md={4} key={room.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: room.type === 'PRIVATE' ? 'secondary.main' : 'primary.main',
                    }}
                  >
                    {room.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {room.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.type === 'PRIVATE' ? 'Salon privé' : 'Salon public'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {room.participantCount} participants
                  </Typography>
                </Box>
                
                <Chip
                  label={`${room.participantCount > 10 ? 'Populaire' : 'Actif'}`}
                  color={room.participantCount > 10 ? 'primary' : 'default'}
                  size="small"
                />
              </CardContent>
              
              <CardActions>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    if (user) {
                      navigate('/chat');
                    } else {
                      navigate('/login');
                    }
                  }}
                >
                  Rejoindre le salon
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const testimonials = [
    {
      name: 'Alex Martin',
      role: 'Développeur Full Stack',
      content: 'La meilleure plateforme de chat que j\'ai utilisée. Interface intuitive et performances excellentes.',
      avatar: 'AM',
    },
    {
      name: 'Sarah Johnson',
      role: 'Chef de projet',
      content: 'Parfait pour la communication d\'équipe. Les salons privés sont très utiles pour nos réunions.',
      avatar: 'SJ',
    },
    {
      name: 'Thomas Bernard',
      role: 'Community Manager',
      content: 'Gestion des utilisateurs simple et efficace. Les statistiques en temps réel sont précieuses.',
      avatar: 'TB',
    },
  ];

  const testimonialsSection = (
    <Box sx={{ mb: 8 }}>
      <Typography variant="h3" textAlign="center" gutterBottom>
        Ce que nos utilisateurs disent
      </Typography>
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {testimonials.map((testimonial, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {testimonial.avatar}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {testimonial.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1">
                "{testimonial.content}"
              </Typography>
              
              <Box display="flex" gap={0.5} mt={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Box key={star} sx={{ color: 'gold' }}>
                    ★
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const ctaSection = (
    <Paper
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
        color: 'white',
        borderRadius: 4,
        p: { xs: 4, md: 8 },
        textAlign: 'center',
      }}
    >
      <RocketLaunchIcon sx={{ fontSize: 60, mb: 3 }} />
      
      <Typography variant="h3" gutterBottom>
        Prêt à commencer ?
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
        Rejoignez des milliers d'utilisateurs satisfaits
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        {user ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/chat')}
            sx={{
              bgcolor: 'white',
              color: theme.palette.secondary.main,
              px: 4,
              '&:hover': {
                bgcolor: alpha('#fff', 0.9),
              },
            }}
            endIcon={<ArrowForwardIcon />}
          >
            Accéder à mon espace
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: theme.palette.secondary.main,
                px: 4,
                '&:hover': {
                  bgcolor: alpha('#fff', 0.9),
                },
              }}
            >
              Créer un compte gratuit
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                color: 'white',
                borderColor: 'white',
                px: 4,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('#fff', 0.1),
                },
              }}
            >
              Se connecter
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {heroSection}
      
      {statsSection}
      
      {featuresSection}
      
      {featuredRoomsSection}
      
      {testimonialsSection}
      
      {ctaSection}
      
      {/* Footer de la homepage */}
      <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: 'divider' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              ChatApp Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              La plateforme de messagerie moderne pour les équipes et les communautés.
              Sécurisée, rapide et intuitive.
            </Typography>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom>
              Produit
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Fonctionnalités
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tarification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API
              </Typography>
            </Stack>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom>
              Ressources
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Documentation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Blog
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Support
              </Typography>
            </Stack>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom>
              Entreprise
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                À propos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Carrières
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact
              </Typography>
            </Stack>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom>
              Légal
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Confidentialité
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conditions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cookies
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            © 2024 ChatApp Pro. Tous droits réservés.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Développé avec ❤️ en France
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;