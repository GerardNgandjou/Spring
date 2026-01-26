// pages/UsersPage.tsx
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
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { userApi } from '../services/api/user';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // États pour la modale de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // États pour la modale d'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    isActive: true,
    password: '',
  });

  // Charger les utilisateurs
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userApi.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && user.isActive) ||
      (statusFilter === 'INACTIVE' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Gérer la suppression
  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await userApi.deleteUser(userToDelete.id);
      if (response.data.success) {
        toast.success('Utilisateur supprimé avec succès');
        setUsers(users.filter(u => u.id !== userToDelete.id));
      } else {
        toast.error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Gérer l'édition
  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditForm({
      isActive: user.isActive,
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!userToEdit) return;
    
    try {
      const response = await userApi.updateUser(userToEdit.id, editForm);
      if (response.data.success) {
        toast.success('Utilisateur mis à jour avec succès');
        setUsers(users.map(u => 
          u.id === userToEdit.id ? response.data.data : u
        ));
        setEditDialogOpen(false);
        setUserToEdit(null);
      } else {
        toast.error(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Erreur de connexion au serveur');
    }
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
            Gestion des utilisateurs
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
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
        <Box display="flex" gap={2} mb={3}>
          <TextField
            fullWidth
            placeholder="Rechercher par email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={roleFilter}
              label="Rôle"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tous les rôles</MenuItem>
              <MenuItem value="USER">USER</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
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
              <MenuItem value="ACTIVE">Actif</MenuItem>
              <MenuItem value="INACTIVE">Inactif</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tableau des utilisateurs */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date d'inscription</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{user.email}</Typography>
                        {user.id === currentUser?.id && (
                          <Chip label="Vous" size="small" color="primary" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={user.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                        label={user.isActive ? 'Actif' : 'Inactif'}
                        color={user.isActive ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {dayjs(user.createdAt).format('DD/MM/YYYY HH:mm')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditClick(user)}
                        disabled={user.id === currentUser?.id}
                        title="Modifier"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.id === currentUser?.id}
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
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
          count={filteredUsers.length}
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

      {/* Dialog de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
            <strong>{userToDelete?.email}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Cette action est irréversible. Toutes les données de cet utilisateur seront perdues.
          </Alert>
        </DialogContent>
        <DialogActions>
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
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Modifier les informations de <strong>{userToEdit?.email}</strong>
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography>Statut:</Typography>
              <Chip
                label={editForm.isActive ? 'Actif' : 'Inactif'}
                color={editForm.isActive ? 'success' : 'default'}
                onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                clickable
              />
            </Box>
            
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              helperText="Laissez vide pour ne pas changer le mot de passe"
              sx={{ mb: 2 }}
            />
            
            <Alert severity="info">
              Seul le mot de passe et le statut peuvent être modifiés.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editForm.password.length > 0 && editForm.password.length < 6}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersPage;