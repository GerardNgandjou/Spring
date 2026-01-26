import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api/user';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
// import { Grid as Grid } from '@mui/material';


const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Données du profil (simulées - à remplacer par l'API)
  const [profileStats, setProfileStats] = useState({
    roomsCreated: 0,
    messagesSent: 0,
    joinDate: user?.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  // Charger les statistiques
  useEffect(() => {
    // TODO: Remplacer par un appel API réel
    const loadStats = async () => {
      try {
        // Simuler des données
        setProfileStats({
          roomsCreated: 3,
          messagesSent: 128,
          joinDate: user?.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error loading profile stats:', error);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  // Changer le mot de passe
  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Minimum 6 caractères';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // TODO: Implémenter l'API de changement de mot de passe
      await userApi.updateUser(user!.id, {
        isActive: true,
        password: formData.newPassword,
      });

      toast.success('Mot de passe changé avec succès');
      setChangePasswordOpen(false);
      setFormData({
        currentPassword: '',
        newPassword: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le profil
  const handleUpdateProfile = async () => {
    // TODO: Implémenter la mise à jour du profil
    toast.success('Profil mis à jour');
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* En-tête */}
        <Box display="flex" alignItems="center" gap={3} mb={4}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              bgcolor: 'primary.main',
              fontSize: 48,
            }}
          >
            {user.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {user.email}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip
                icon={<SecurityIcon />}
                label={user.role}
                color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                variant="outlined"
              />
              <Chip
                icon={<CheckCircleIcon />}
                label={user.isActive ? 'Actif' : 'Inactif'}
                color={user.isActive ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Membre depuis {dayjs(user.createdAt).format('DD/MM/YYYY')}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setChangePasswordOpen(true)}
              sx={{ mb: 1 }}
            >
              Changer mot de passe
            </Button>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpdateProfile}
                  sx={{ ml: 1 }}
                >
                  Enregistrer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setIsEditing(false)}
                  sx={{ ml: 1 }}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{ ml: 1 }}
              >
                Modifier
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Informations détaillées */}
        <Typography variant="h6" gutterBottom>
          Informations du compte
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Email"
              secondary={
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body1">{user.email}</Typography>
                </Box>
              }
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Rôle"
              secondary={
                <Chip
                  label={user.role}
                  color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                  size="small"
                />
              }
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Statut"
              secondary={
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon
                    fontSize="small"
                    color={user.isActive ? 'success' : 'error'}
                  />
                  <Typography variant="body1">
                    {user.isActive ? 'Compte actif' : 'Compte désactivé'}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Date d'inscription"
              secondary={dayjs(user.createdAt).format('DD/MM/YYYY à HH:mm')}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemText
              primary="Dernière connexion"
              secondary={dayjs(profileStats.lastLogin).format('DD/MM/YYYY à HH:mm')}
            />
          </ListItem>
        </List>

        {/* Zone d'édition (simplifiée) */}
        {isEditing && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Modifier le profil
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Les modifications seront disponibles prochainement.
            </Alert>
            {/* Ajouter des champs d'édition ici */}
          </Box>
        )}

        {/* Dialog pour changer le mot de passe */}
        <Dialog
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                type="password"
                label="Mot de passe actuel"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="password"
                label="Nouveau mot de passe"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                disabled={loading}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setChangePasswordOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Changer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ProfilePage;