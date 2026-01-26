import React from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <Typography variant="h1" color="primary" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Page non trouvée
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            size="large"
          >
            Retour
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            size="large"
          >
            Accueil
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;