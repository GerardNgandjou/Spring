// pages/MessagesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { messageApi } from '../services/api/message';
import { chatApi } from '../services/api/chat';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    email: string;
  };
  chatRoom: {
    id: number;
    name: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatRoom {
  id: number;
  name: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // États pour la modale de détails
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger les salons
      const roomsResponse = await chatApi.getRooms();
      setRooms(roomsResponse.data || []);
      
      // Charger les messages de tous les salons
      const allMessages: Message[] = [];
      
      for (const room of roomsResponse.data || []) {
        try {
          const messagesResponse = await messageApi.getOrderedMessages(room.id);
          const roomMessages = (messagesResponse.data || []).map((msg: any) => ({
            ...msg,
            chatRoom: {
              id: room.id,
              name: room.name,
            },
          }));
          allMessages.push(...roomMessages);
        } catch (error) {
          console.error(`Error loading messages for room ${room.id}:`, error);
        }
      }
      
      // Trier par date (plus récent d'abord)
      allMessages.sort((a, b) => 
        dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );
      
      setMessages(allMessages);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.message || 'Erreur de connexion au serveur');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.chatRoom.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoom = roomFilter === 'ALL' || message.chatRoom.id === roomFilter;
    
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && !message.isDeleted) ||
      (statusFilter === 'DELETED' && message.isDeleted);
    
    return matchesSearch && matchesRoom && matchesStatus;
  });

  // Pagination
  const paginatedMessages = filteredMessages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Gérer la suppression/restauration
  const handleToggleDelete = async (message: Message, restore: boolean = false) => {
    try {
      if (restore) {
        await messageApi.restoreMessage(message.id);
        toast.success('Message restauré avec succès');
      } else {
        await messageApi.deleteMessage(message.id);
        toast.success('Message supprimé avec succès');
      }
      
      // Mettre à jour l'état local
      setMessages(messages.map(m => 
        m.id === message.id ? { ...m, isDeleted: !restore } : m
      ));
      
    } catch (error: any) {
      console.error('Error toggling message:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  // Ouvrir les détails du message
  const handleViewDetails = (message: Message) => {
    setSelectedMessage(message);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            Gestion des messages
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Actualiser
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Barre de filtres */}
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            placeholder="Rechercher dans les messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Salon</InputLabel>
            <Select
              value={roomFilter}
              label="Salon"
              onChange={(e) => setRoomFilter(e.target.value as number | 'ALL')}
            >
              <MenuItem value="ALL">Tous les salons</MenuItem>
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tous les statuts</MenuItem>
              <MenuItem value="ACTIVE">Actifs</MenuItem>
              <MenuItem value="DELETED">Supprimés</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {filteredMessages.length} message(s) trouvé(s) • {messages.filter(m => m.isDeleted).length} message(s) supprimé(s)
        </Typography>
      </Paper>

      {/* Tableau des messages */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contenu</TableCell>
                <TableCell>Expéditeur</TableCell>
                <TableCell>Salon</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucun message trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMessages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    hover 
                    sx={{ 
                      opacity: message.isDeleted ? 0.6 : 1,
                      backgroundColor: message.isDeleted ? 'action.hover' : 'inherit'
                    }}
                    onClick={() => handleViewDetails(message)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography 
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {message.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {message.sender.email.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {message.sender.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ChatIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {message.chatRoom.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {dayjs(message.createdAt).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={message.isDeleted ? 'Supprimé' : 'Actif'}
                        color={message.isDeleted ? 'default' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {message.isDeleted ? (
                        <IconButton
                          color="primary"
                          onClick={() => handleToggleDelete(message, true)}
                          title="Restaurer"
                        >
                          <RestoreIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          color="error"
                          onClick={() => handleToggleDelete(message, false)}
                          title="Supprimer"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredMessages.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count}`
          }
        />
      </Paper>

      {/* Dialog de détails */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedMessage && (
          <>
            <DialogTitle>
              Détails du message
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                {/* Carte du message */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="body1" paragraph>
                      {selectedMessage.content}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {selectedMessage.sender.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedMessage.sender.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Expéditeur
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <ChatIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedMessage.chatRoom.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Salon
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Chip
                        label={selectedMessage.isDeleted ? 'Supprimé' : 'Actif'}
                        color={selectedMessage.isDeleted ? 'default' : 'success'}
                      />
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Informations détaillées */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Informations temporelles
                        </Typography>
                        <Box>
                        <Typography variant="body2">
                            <strong>Créé le:</strong>{' '}
                            {dayjs(selectedMessage.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Modifié le:</strong>{' '}
                            {dayjs(selectedMessage.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
                        </Typography>
                        </Box>
                    </Paper>
                    
                    <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Actions
                        </Typography>
                        <Box display="flex" gap={1}>
                        {selectedMessage.isDeleted ? (
                            <Button
                            variant="contained"
                            startIcon={<RestoreIcon />}
                            onClick={() => {
                                handleToggleDelete(selectedMessage, true);
                                setDetailDialogOpen(false);
                            }}
                            >
                            Restaurer le message
                            </Button>
                        ) : (
                            <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => {
                                handleToggleDelete(selectedMessage, false);
                                setDetailDialogOpen(false);
                            }}
                            >
                            Supprimer le message
                            </Button>
                        )}
                        </Box>
                    </Paper>
                    </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default MessagesPage;