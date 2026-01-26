// pages/AdminDashboard.tsx - VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Grid,
} from '@mui/material';
import {
  People as PeopleIcon,
  Chat as ChatIcon,
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { userApi } from '../services/api/user';
import { chatApi } from '../services/api/chat';
import { messageApi } from '../services/api/message';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

// Types
interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface ChatRoom {
  id: number;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participantCount: number;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  activeUsers: number;
  newUsersToday: number;
}

interface RecentUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentRoom {
  id: number;
  name: string;
  type: string;
  participantCount: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRooms: 0,
    totalMessages: 0,
    activeUsers: 0,
    newUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques utilisateurs
      const usersResponse = await userApi.getAllUsers();
      const users: User[] = usersResponse.data.data || [];
      
      // Charger les salons
      const roomsResponse = await chatApi.getRooms();
      const rooms: ChatRoom[] = roomsResponse.data || [];
      
      // Statistiques
      const today = dayjs().startOf('day');
      const newUsersToday = users.filter((u: User) => 
        dayjs(u.createdAt).isAfter(today)
      ).length;
      
      const activeUsers = users.filter((u: User) => u.isActive).length;
      
      // Estimer le nombre total de messages
      let totalMessages = 0;
      for (const room of rooms) {
        try {
          const messagesResponse = await messageApi.getOrderedMessages(room.id);
          totalMessages += (messagesResponse.data || []).length;
        } catch (error) {
          console.error(`Error loading messages for room ${room.id}:`, error);
        }
      }
      
      setStats({
        totalUsers: users.length,
        totalRooms: rooms.length,
        totalMessages,
        activeUsers,
        newUsersToday,
      });
      
      // Utilisateurs récents (5 derniers)
      setRecentUsers(
        users
          .sort((a: User, b: User) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
          .slice(0, 5)
          .map((u: User) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          }))
      );
      
      // Salons récents (5 derniers)
      setRecentRooms(
        rooms.slice(0, 5).map((room: ChatRoom) => ({
          id: room.id,
          name: room.name,
          type: room.type,
          participantCount: room.participantCount,
        }))
      );
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
    trend?: number; 
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Icon sx={{ fontSize: 40, color }} />
          {trend !== undefined && (
            <Chip
              icon={trend >= 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              label={`${trend >= 0 ? '+' : ''}${trend}%`}
              color={trend >= 0 ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>
        <Typography variant="h4" gutterBottom>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Tableau de bord administrateur
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenue, {user?.email} • Dernière mise à jour: {dayjs().format('HH:mm:ss')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
          >
            Actualiser
          </Button>
        </Box>
      </Paper>

      {/* Statistiques - CORRIGÉ avec Grid2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Utilisateurs totaux"
            value={stats.totalUsers}
            icon={PeopleIcon}
            color="#1976d2"
            trend={5}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Utilisateurs actifs"
            value={stats.activeUsers}
            icon={TrendingUpIcon}
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Nouveaux aujourd'hui"
            value={stats.newUsersToday}
            icon={PeopleIcon}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Salons de chat"
            value={stats.totalRooms}
            icon={ChatIcon}
            color="#9c27b0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard
            title="Messages envoyés"
            value={stats.totalMessages}
            icon={MessageIcon}
            color="#f44336"
          />
        </Grid>
      </Grid>

      {/* Contenu principal - CORRIGÉ avec Grid2 */}
      <Grid container spacing={3}>
        {/* Utilisateurs récents */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Utilisateurs récents
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/users')}
              >
                Voir tout
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Date d'inscription</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {dayjs(user.createdAt).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Salons récents */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Salons récents
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/chat')}
              >
                Voir tout
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRooms.map((room) => (
                    <TableRow key={room.id} hover>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={room.type === 'PRIVATE' ? 'Privé' : 'Groupe'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{room.participantCount}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Actions rapides - CORRIGÉ avec Grid2 */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions rapides
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/users')}
                >
                  Gérer utilisateurs
                </Button>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => navigate('/chat')}
                >
                  Voir les salons
                </Button>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MessageIcon />}
                  onClick={() => navigate('/profile')}
                >
                  Mon profil
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;