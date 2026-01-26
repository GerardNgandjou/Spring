import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  ListItemButton,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { chatApi } from '../../services/api/chat';
import { userApi } from '../../services/api/user';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { ChatParticipantResponse } from '../../types/chat.types';
import type { UserResponse } from '../../types/user.types';

interface ParticipantsPanelProps {
  roomId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  roomId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<ChatParticipantResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les participants
  const loadParticipants = async () => {
    if (!roomId) return;
    
    try {
      const data = await chatApi.getParticipants(roomId);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Erreur lors du chargement des participants');
    }
  };

  // Charger tous les utilisateurs
  const loadAllUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    if (isOpen && roomId) {
      setLoading(true);
      Promise.all([loadParticipants(), loadAllUsers()])
        .finally(() => setLoading(false));
    }
  }, [isOpen, roomId]);

  // Ajouter un participant
  const handleAddParticipant = async () => {
    if (!selectedUser || !roomId) return;

    try {
      await chatApi.addParticipant({
        userId: selectedUser,
        chatRoomId: roomId,
        role,
      });

      await loadParticipants();
      setSelectedUser(null);
      setRole('MEMBER');
      setAddingParticipant(false);
      toast.success('Participant ajouté');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Erreur lors de l\'ajout du participant');
    }
  };

  // Supprimer un participant
  const handleRemoveParticipant = async (userId: number) => {
    if (!window.confirm('Supprimer ce participant ?')) return;

    try {
      await chatApi.removeParticipant(roomId, userId);
      await loadParticipants();
      toast.success('Participant supprimé');
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Vérifier si l'utilisateur courant peut gérer les participants
  const canManageParticipants = participants.some(
    p => p.user.id === user?.id && (p.role === 'OWNER' || p.role === 'ADMIN')
  );

  // Filtrer les utilisateurs non participants
  const availableUsers = allUsers.filter(
    u => !participants.some(p => p.user.id === u.id)
  );

  // Filtrer par recherche
  const filteredUsers = availableUsers.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Participants</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Participants ({participants.length})
          </Typography>
          <Box display="flex" gap={1}>
            {canManageParticipants && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddingParticipant(true)}
              >
                Ajouter
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Liste des participants */}
        <List>
          {participants.map((participant) => (
            <ListItem
              key={participant.id}
              secondaryAction={
                canManageParticipants &&
                participant.user.id !== user?.id &&
                participant.role !== 'OWNER' ? (
                  <Tooltip title="Supprimer">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveParticipant(participant.user.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
            >
              <ListItemAvatar>
                <Avatar>
                  {participant.user.email.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1">
                      {participant.user.email}
                    </Typography>
                    {participant.user.id === user?.id && (
                      <Chip label="Vous" size="small" color="primary" />
                    )}
                    {participant.role === 'OWNER' && (
                      <Chip
                        icon={<AdminIcon />}
                        label="Propriétaire"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {participant.role === 'ADMIN' && (
                      <Chip
                        icon={<ShieldIcon />}
                        label="Admin"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Rejoint le {new Date(participant.joinedAt).toLocaleDateString()}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Modal d'ajout de participant */}
        <Dialog
          open={addingParticipant}
          onClose={() => {
            setAddingParticipant(false);
            setSelectedUser(null);
            setSearchTerm('');
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Ajouter un participant</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Rechercher un utilisateur"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mt: 2 }}
            />

            <List sx={{ maxHeight: 200, overflow: "auto", mt: 2 }}>
            {filteredUsers.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                Aucun utilisateur trouvé
                </Alert>
            ) : (
                filteredUsers.map((user) => (
                <ListItemButton
                    key={user.id}
                    selected={selectedUser === user.id}
                    onClick={() => setSelectedUser(user.id)}
                >
                    <ListItemAvatar>
                    <Avatar>
                        {user.email.charAt(0).toUpperCase()}
                    </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                    primary={user.email}
                    secondary={`Inscrit le ${new Date(
                        user.createdAt
                    ).toLocaleDateString()}`}
                    />
                </ListItemButton>
                ))
            )}
            </List>


            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Rôle du participant
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant={role === 'MEMBER' ? 'contained' : 'outlined'}
                  onClick={() => setRole('MEMBER')}
                  fullWidth
                >
                  Membre
                </Button>
                <Button
                  variant={role === 'ADMIN' ? 'contained' : 'outlined'}
                  onClick={() => setRole('ADMIN')}
                  fullWidth
                >
                  Admin
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddingParticipant(false);
                setSelectedUser(null);
                setSearchTerm('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleAddParticipant}
              disabled={!selectedUser}
            >
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsPanel;