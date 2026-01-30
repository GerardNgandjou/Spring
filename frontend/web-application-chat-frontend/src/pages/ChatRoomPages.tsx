// pages/ChatRoomsPage.tsx - VERSION AMÉLIORÉE
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
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
  DialogActions,
  Tooltip,
  Avatar,
  Badge,
  InputAdornment,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Dashboard as DashboardIcon,
  FormatListBulleted as ListIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  FormatListBulleted,
} from '@mui/icons-material';
import { chatApi } from '../services/api/chat';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

// Dans ChatRoomsPage.tsx - modifiez l'interface ChatRoom
interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: 'PRIVATE' | 'GROUP' | 'PUBLIC' | string; // Ajoutez | string
  participantCount: number;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
}

const ChatRoomsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'participants' | 'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  
  // États pour la modale
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'GROUP' as 'PRIVATE' | 'GROUP' | 'PUBLIC',
  });
  
  // États pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ChatRoom | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    totalRooms: 0,
    privateRooms: 0,
    publicRooms: 0,
    totalParticipants: 0,
    activeRooms: 0,
  });

  // Charger les salons
  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.getAllChatRooms();
      const roomsData: ChatRoom[] = response.data || [];
      setRooms(roomsData);
      
      // Calculer les statistiques
      const privateRooms = roomsData.filter(room => room.type === 'PRIVATE').length;
      const publicRooms = roomsData.filter(room => room.type === 'PUBLIC' || room.type === 'GROUP').length;
      const totalParticipants = roomsData.reduce((sum, room) => sum + (room.participantCount || 0), 0);
      const activeRooms = roomsData.filter(room => (room.participantCount || 0) > 0).length;
      
      setStats({
        totalRooms: roomsData.length,
        privateRooms,
        publicRooms,
        totalParticipants,
        activeRooms,
      });
      
      toast.success(`${roomsData.length} salons chargés`);
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

  // Filtrer et trier les salons
  const filteredRooms = rooms
    .filter(room => {
      const matchesSearch = 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || room.type === typeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'participants':
          aValue = a.participantCount || 0;
          bValue = b.participantCount || 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const paginatedRooms = filteredRooms.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Gestion des actions
  const handleOpenDialog = (room?: ChatRoom) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        name: room.name,
        description: room.description || '',
        type: room.type as 'PRIVATE' | 'GROUP' | 'PUBLIC',
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

  const handleSaveRoom = async () => {
    if (!roomForm.name.trim()) {
      toast.error('Le nom du salon est requis');
      return;
    }

    setDialogLoading(true);
    try {
      if (editingRoom) {
        // Mise à jour
        const response = await chatApi.updateChatRoom(editingRoom.id, {
          name: roomForm.name,
          description: roomForm.description || undefined,
          type: roomForm.type,
        });
        
        setRooms(prevRooms =>
          prevRooms.map(room =>
            room.id === editingRoom.id ? response.data : room
          )
        );
        toast.success('Salon mis à jour avec succès');
      } else {
        // Création
        const response = await chatApi.createChatRoom({
          name: roomForm.name,
          description: roomForm.description || undefined,
          type: roomForm.type,
        });
        
        setRooms(prevRooms => [...prevRooms, response.data]);
        toast.success('Salon créé avec succès');
      }
      
      setDialogOpen(false);
      setEditingRoom(null);
      setRoomForm({ name: '', description: '', type: 'GROUP' });
      
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteClick = (room: ChatRoom) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    
    setDeleteLoading(true);
    try {
      await chatApi.deleteChatRoom(roomToDelete.id);
      
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomToDelete.id));
      toast.success('Salon supprimé avec succès');
      
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleJoinRoom = (roomId: number) => {
    navigate(`/chat/${roomId}`);
  };

  const handleViewDetails = (roomId: number) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Composants
  const RoomCard = ({ room }: { room: ChatRoom }) => (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Avatar
            sx={{
              bgcolor: room.type === 'PRIVATE' ? theme.palette.error.main : theme.palette.primary.main,
              width: 48,
              height: 48,
            }}
          >
            {room.type === 'PRIVATE' ? <LockIcon /> : <GroupIcon />}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" noWrap title={room.name}>
              {room.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {room.type === 'PRIVATE' ? 'Salon privé' : 'Salon public'}
            </Typography>
          </Box>
        </Box>
        
        {room.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {room.description}
          </Typography>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2}>
            <Tooltip title="Participants">
              <Chip
                icon={<PeopleIcon />}
                label={room.participantCount}
                size="small"
                variant="outlined"
              />
            </Tooltip>
            {room.messageCount !== undefined && (
              <Tooltip title="Messages">
                <Chip
                  icon={<MessageIcon />}
                  label={room.messageCount}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
          
          <Tooltip title={dayjs(room.createdAt).format('DD/MM/YYYY HH:mm')}>
            <Typography variant="caption" color="text.secondary">
              {dayjs(room.createdAt).fromNow()}
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
        <Tooltip title="Rejoindre">
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleJoinRoom(room.id)}
          >
            Rejoindre
          </Button>
        </Tooltip>
        
        <Box>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(room)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(room)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
    subtitle?: string;
  }) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 2,
        flex: 1,
        minWidth: 120,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Icon sx={{ color }} />
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  if (loading && rooms.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête avec statistiques */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Gestion des salons
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez tous les salons de discussion de votre application
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Actualiser">
              <IconButton 
                onClick={loadRooms}
                sx={{ 
                  bgcolor: 'white',
                  boxShadow: theme.shadows[1],
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                px: 3,
              }}
            >
              Nouveau salon
            </Button>
          </Box>
        </Box>
        
        {/* Statistiques */}
        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <StatCard
            title="Total"
            value={stats.totalRooms}
            icon={DashboardIcon}
            color={theme.palette.primary.main}
            subtitle="salons"
          />
          
          <StatCard
            title="Publics"
            value={stats.publicRooms}
            icon={PublicIcon}
            color={theme.palette.success.main}
            subtitle="salons"
          />
          
          <StatCard
            title="Privés"
            value={stats.privateRooms}
            icon={LockIcon}
            color={theme.palette.error.main}
            subtitle="salons"
          />
          
          <StatCard
            title="Participants"
            value={stats.totalParticipants}
            icon={PeopleIcon}
            color={theme.palette.warning.main}
            subtitle="total"
          />
          
          <StatCard
            title="Actifs"
            value={stats.activeRooms}
            icon={MessageIcon}
            color={theme.palette.info.main}
            subtitle="salons"
          />
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            icon={<WarningIcon />}
            sx={{ 
              mb: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* Barre de contrôle */}
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            placeholder="Rechercher un salon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="ALL">
                <Box display="flex" alignItems="center" gap={1}>
                  <FilterIcon fontSize="small" />
                  Tous les types
                </Box>
              </MenuItem>
              <MenuItem value="PUBLIC">
                <Box display="flex" alignItems="center" gap={1}>
                  <PublicIcon fontSize="small" />
                  Public
                </Box>
              </MenuItem>
              <MenuItem value="PRIVATE">
                <Box display="flex" alignItems="center" gap={1}>
                  <LockIcon fontSize="small" />
                  Privé
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              label="Trier par"
              onChange={(e) => setSortBy(e.target.value as any)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="name">Nom</MenuItem>
              <MenuItem value="participants">Participants</MenuItem>
              <MenuItem value="created">Date de création</MenuItem>
              <MenuItem value="updated">Dernière activité</MenuItem>
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{ 
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                borderRadius: '8px !important',
              }
            }}
          >
            <ToggleButton value="list" title="Vue liste">
              <ListIcon />
            </ToggleButton>
            <ToggleButton value="grid" title="Vue grille">
              <DashboardIcon />
            </ToggleButton>
            <ToggleButton value="compact" title="Vue compacte">
              <FormatListBulleted />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {filteredRooms.length} salon(s) trouvé(s)
          {searchTerm && ` pour "${searchTerm}"`}
        </Typography>
      </Paper>

      {/* Vue grille */}
      {viewMode === 'grid' && (
        <Box
          display="flex"
          flexWrap="wrap"
          gap={3}
        >
          {paginatedRooms.map((room) => (
            <Box
              key={room.id}
              flex="1 1 calc(33.333% - 16px)"
              minWidth="280px"
              maxWidth="400px"
            >
              <RoomCard room={room} />
            </Box>
          ))}
        </Box>
      )}

      {/* Vue liste */}
      {viewMode === 'list' && (
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleSort('name')}
                      startIcon={<SortIcon />}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Nom
                      {sortBy === 'name' && (
                        <Typography component="span" sx={{ ml: 0.5 }}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Typography>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleSort('participants')}
                      startIcon={<PeopleIcon />}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Participants
                      {sortBy === 'participants' && (
                        <Typography component="span" sx={{ ml: 0.5 }}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Typography>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleSort('created')}
                      startIcon={<CalendarIcon />}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Créé le
                      {sortBy === 'created' && (
                        <Typography component="span" sx={{ ml: 0.5 }}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Typography>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {paginatedRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Aucun salon trouvé
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Créez votre premier salon'}
                        </Typography>
                        {!searchTerm && (
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{ mt: 2 }}
                          >
                            Créer un salon
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRooms.map((room) => (
                    <TableRow 
                      key={room.id} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.02) 
                        } 
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: room.type === 'PRIVATE' ? theme.palette.error.main : theme.palette.primary.main,
                              width: 40,
                              height: 40,
                            }}
                          >
                            {room.type === 'PRIVATE' ? <LockIcon /> : <GroupIcon />}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="medium">
                              {room.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {room.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {room.description || '—'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={room.type === 'PRIVATE' ? <LockIcon /> : <PublicIcon />}
                          label={room.type === 'PRIVATE' ? 'Privé' : 'Public'}
                          size="small"
                          color={room.type === 'PRIVATE' ? 'error' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Badge 
                            badgeContent={room.participantCount} 
                            color="primary"
                            max={999}
                          >
                            <PeopleIcon color="action" />
                          </Badge>
                          {room.messageCount !== undefined && (
                            <Badge 
                              badgeContent={room.messageCount} 
                              color="secondary"
                              max={999}
                              sx={{ ml: 1 }}
                            >
                              <MessageIcon color="action" />
                            </Badge>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {dayjs(room.createdAt).format('DD/MM/YYYY')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(room.createdAt).fromNow()}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Rejoindre">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleJoinRoom(room.id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenDialog(room)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(room)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {filteredRooms.length > 0 && (
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
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} sur ${count}`
              }
              sx={{
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            />
          )}
        </Paper>
      )}

      {/* Vue compacte */}
      {viewMode === 'compact' && (
        <Box display="flex" flexDirection="column" gap={1}>
          {paginatedRooms.map((room) => (
            <Paper
              key={room.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2} flex={1}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {room.type === 'PRIVATE' ? <LockIcon /> : <GroupIcon />}
                  </Avatar>
                  
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body1" fontWeight="medium" noWrap>
                      {room.name}
                    </Typography>
                    {room.description && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {room.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {room.participantCount}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={room.type === 'PRIVATE' ? 'Privé' : 'Public'}
                    size="small"
                    color={room.type === 'PRIVATE' ? 'error' : 'primary'}
                    variant="outlined"
                  />
                  
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(room.createdAt).fromNow()}
                  </Typography>
                  
                  <Box display="flex" gap={0.5}>
                    <IconButton size="small" onClick={() => handleJoinRoom(room.id)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(room)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(room)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog création/édition */}
      <Dialog
        open={dialogOpen}
        onClose={() => !dialogLoading && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {editingRoom ? 'Modifier le salon' : 'Nouveau salon'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nom du salon"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              required
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={roomForm.description}
              onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 2 } }}
              helperText="Optionnel - Décrivez le sujet ou le but de ce salon"
            />
            
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Type de salon</InputLabel>
              <Select
                value={roomForm.type}
                label="Type de salon"
                onChange={(e) => setRoomForm({ 
                  ...roomForm, 
                  type: e.target.value as 'PRIVATE' | 'GROUP' | 'PUBLIC'
                })}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="PUBLIC">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PublicIcon fontSize="small" />
                    <Box>
                      <Typography>Public</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Accessible à tous les utilisateurs
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="PRIVATE">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon fontSize="small" />
                    <Box>
                      <Typography>Privé</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Accès limité aux membres invités
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={dialogLoading}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveRoom}
            variant="contained"
            disabled={dialogLoading || !roomForm.name.trim()}
            sx={{ borderRadius: 2 }}
          >
            {dialogLoading ? (
              <CircularProgress size={24} />
            ) : editingRoom ? (
              'Mettre à jour'
            ) : (
              'Créer le salon'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              Confirmer la suppression
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography paragraph>
            Êtes-vous sûr de vouloir supprimer le salon{' '}
            <strong>"{roomToDelete?.name}"</strong> ?
          </Typography>
          
          <Alert 
            severity="warning" 
            icon={<InfoIcon />}
            sx={{ 
              mt: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">
              Cette action est irréversible. Tous les messages, participants et données associées à ce salon seront définitivement supprimés.
            </Typography>
          </Alert>
          
          {roomToDelete && roomToDelete.participantCount > 0 && (
            <Alert 
              severity="info"
              sx={{ 
                mt: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">
                Ce salon contient actuellement {roomToDelete.participantCount} participant(s).
              </Typography>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            sx={{ borderRadius: 2 }}
          >
            {deleteLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatRoomsPage;