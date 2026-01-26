// pages/ChatRoomsPage.tsx
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
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { chatApi } from '../services/api/chat';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
// Importez Grid2 au lieu de Grid
// import Grid2 from '@mui/material'; // Note: Grid2

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: 'PRIVATE' | 'GROUP';
  participantCount: number;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

const ChatRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // États pour la modale de création/édition
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [dialogLoading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'GROUP' as 'PRIVATE' | 'GROUP',
  });
  
  // États pour la modale de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete] = useState<ChatRoom | null>(null);
  const [deleteLoading] = useState(false);

  // Charger les salons
  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.getRooms();
      setRooms(response.data || []);
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      setError(error.response?.data?.message || 'Erreur de connexion au serveur');
      toast.error('Erreur lors du chargement des salons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Filtrer les salons
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || room.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Pagination
  const paginatedRooms = filteredRooms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Gérer la création/édition
  const handleOpenDialog = (room?: ChatRoom) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        name: room.name,
        description: room.description || '',
        type: room.type,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({
        name: '',
        description: '',
        type: 'GROUP',
      });
    }
    setDialogOpen(true);
  };

//   const handleSaveRoom = async () => {
//     if (!roomForm.name.trim()) {
//       toast.error('Le nom du salon est requis');
//       return;
//     }

//     setDialogLoading(true);
//     try {
//       if (editingRoom) {
//         // Mise à jour
//         const response = await chatApi.updateRoom(editingRoom.id, {
//           name: roomForm.name,
//           type: roomForm.type,
//         });
//         toast.success('Salon mis à jour avec succès');
//         setRooms(rooms.map(r => 
//           r.id === editingRoom.id ? response.data : r
//         ));
//       } else {
//         // Création
//         const response = await chatApi.createRoom({
//           name: roomForm.name,
//           type: roomForm.type,
//           userIds: [user!.id],
//         });
//         toast.success('Salon créé avec succès');
//         setRooms([...rooms, response.data]);
//       }
//       setDialogOpen(false);
//     } catch (error: any) {
//       console.error('Error saving room:', error);
//       toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
//     } finally {
//       setDialogLoading(false);
//     }
//   };

//   // Gérer la suppression
//   const handleDeleteClick = (room: ChatRoom) => {
//     setRoomToDelete(room);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!roomToDelete) return;
    
//     setDeleteLoading(true);
//     try {
//       await chatApi.deleteRoom(roomToDelete.id);
//       toast.success('Salon supprimé avec succès');
//       setRooms(rooms.filter(r => r.id !== roomToDelete.id));
//     } catch (error: any) {
//       console.error('Error deleting room:', error);
//       toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
//     } finally {
//       setDeleteLoading(false);
//       setDeleteDialogOpen(false);
//       setRoomToDelete(null);
//     }
//   };

  // Carte de salon (vue grille)
  const RoomCard = ({ room }: { room: ChatRoom }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {room.type === 'PRIVATE' ? (
            <LockIcon color="action" fontSize="small" />
          ) : (
            <PublicIcon color="action" fontSize="small" />
          )}
          <Typography variant="h6" noWrap>
            {room.name}
          </Typography>
        </Box>
        
        {room.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {room.description.length > 100 
              ? `${room.description.substring(0, 100)}...` 
              : room.description}
          </Typography>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<PeopleIcon />}
              label={`${room.participantCount}`}
              size="small"
              variant="outlined"
            />
            {room.messageCount !== undefined && (
              <Chip
                icon={<MessageIcon />}
                label={`${room.messageCount}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Chip
            label={room.type === 'PRIVATE' ? 'Privé' : 'Public'}
            size="small"
            color={room.type === 'PRIVATE' ? 'secondary' : 'primary'}
          />
        </Box>
      </CardContent>
      
      {/* <CardActions>
        <Button size="small" onClick={() => handleOpenDialog(room)}>
          Modifier
        </Button>
        <Button 
          size="small" 
          color="error"
          onClick={() => handleDeleteClick(room)}
        >
          Supprimer
        </Button>
      </CardActions> */}
    </Card>
  );

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
            Gestion des salons de chat
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nouveau salon
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadRooms}
            >
              Actualiser
            </Button>
          </Box>
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
            placeholder="Rechercher un salon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tous les types</MenuItem>
              <MenuItem value="GROUP">Public</MenuItem>
              <MenuItem value="PRIVATE">Privé</MenuItem>
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="list">
              Liste
            </ToggleButton>
            <ToggleButton value="grid">
              Grille
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {filteredRooms.length} salon(s) trouvé(s)
        </Typography>
      </Paper>

      {/* Vue grille */}
      {viewMode === 'grid' ? (
        
        // Puis utilisez comme ceci :
        <Grid container spacing={3}>
        {paginatedRooms.map((room) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
            <RoomCard room={room} />
            </Grid>
        ))}
        </Grid>
      ) : (
        /* Vue tableau */
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Aucun salon trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRooms.map((room) => (
                    <TableRow key={room.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {room.type === 'PRIVATE' ? (
                            <LockIcon fontSize="small" color="action" />
                          ) : (
                            <PublicIcon fontSize="small" color="action" />
                          )}
                          <Typography fontWeight="medium">
                            {room.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {room.description || 'Aucune description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={room.type === 'PRIVATE' ? 'Privé' : 'Public'}
                          size="small"
                          color={room.type === 'PRIVATE' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography>{room.participantCount}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {dayjs(room.createdAt).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(room)}
                          title="Modifier"
                        >
                          <EditIcon />
                        </IconButton>
                        {/* <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(room)}
                          title="Supprimer"
                        >
                          <DeleteIcon />
                        </IconButton> */}
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
            count={filteredRooms.length}
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
      )}

      {/* Dialog création/édition */}
      <Dialog
        open={dialogOpen}
        onClose={() => !dialogLoading && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRoom ? 'Modifier le salon' : 'Créer un nouveau salon'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom du salon"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={roomForm.description}
              onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type de salon</InputLabel>
              <Select
                value={roomForm.type}
                label="Type de salon"
                onChange={(e) => setRoomForm({ 
                  ...roomForm, 
                  type: e.target.value as 'PRIVATE' | 'GROUP' 
                })}
              >
                <MenuItem value="GROUP">Public (Groupe)</MenuItem>
                <MenuItem value="PRIVATE">Privé</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        {/* <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={dialogLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveRoom}
            variant="contained"
            disabled={dialogLoading || !roomForm.name.trim()}
          >
            {dialogLoading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions> */}
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le salon{' '}
            <strong>{roomToDelete?.name}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Cette action est irréversible. Tous les messages de ce salon seront également supprimés.
          </Alert>
        </DialogContent>
        {/* <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions> */}
      </Dialog>
    </Container>
  );
};

export default ChatRoomsPage;