
import { Box, Button, Typography, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type ReactNode, type ErrorInfo, Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Vous pourriez envoyer l'erreur à un service de tracking ici
    // logErrorToService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Composant de fallback
const ErrorFallback: React.FC<{ error: Error | null }> = ({ error }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Oups ! Une erreur est survenue
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Désolé, quelque chose s'est mal passé. Veuillez réessayer.
        </Typography>

        {error && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              my: 3,
              backgroundColor: 'grey.50',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Typography variant="caption" color="error">
              {error.toString()}
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Rafraîchir la page
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            Retour à l'accueil
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          Si le problème persiste, contactez le support.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ErrorBoundary;