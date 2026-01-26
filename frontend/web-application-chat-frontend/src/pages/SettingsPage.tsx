import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, Palette as PaletteIcon, Language as LanguageIcon } from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState({
    theme: 'light',
    language: 'fr',
    notifications: true,
    sound: true,
    autoSave: true,
  });

  const handleChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Sauvegarder les paramètres
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Paramètres sauvegardés !');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* Apparence */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon />
            Apparence
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Thème</InputLabel>
            <Select
              value={settings.theme}
              label="Thème"
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <MenuItem value="light">Clair</MenuItem>
              <MenuItem value="dark">Sombre</MenuItem>
              <MenuItem value="system">Système</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Langue */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon />
            Langue
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Langue</InputLabel>
            <Select
              value={settings.language}
              label="Langue"
              onChange={(e) => handleChange('language', e.target.value)}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Notifications */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
              />
            }
            label="Activer les notifications"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.sound}
                onChange={(e) => handleChange('sound', e.target.checked)}
              />
            }
            label="Son des notifications"
            sx={{ display: 'block', mb: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Autres */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Autres paramètres
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSave}
                onChange={(e) => handleChange('autoSave', e.target.checked)}
              />
            }
            label="Sauvegarde automatique"
            sx={{ display: 'block', mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Message d'accueil"
            placeholder="Personnalisez votre message d'accueil..."
            multiline
            rows={3}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined">
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          Certains paramètres nécessitent un rechargement de la page pour être appliqués.
        </Alert>
      </Paper>
    </Container>
  );
};

export default SettingsPage;