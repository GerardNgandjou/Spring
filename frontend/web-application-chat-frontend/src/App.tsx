// App.tsx - VERSION CORRIGÉE
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminDashboard from './pages/AdminPages';
import ChatRoomsPage from './pages/ChatRoomPages';
import MessagesPage from './pages/MessagePages';
import UsersPage from './pages/UserPage';
import ChatPage from './pages/ChatPage';
// import ChatsPages from './pages/ChatPages';

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <Routes>
          {/* Route publique - Homepage */}
          <Route path="/" element={<HomePage />} />
          
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Routes protégées - utilisateur normal */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Routes protégées - administrateur */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <UsersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/rooms" element={
            <ProtectedRoute adminOnly>
              <ChatRoomsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/messages" element={
            <ProtectedRoute adminOnly>
              <MessagesPage />
            </ProtectedRoute>
          } />
          
          {/* Alias pour compatibilité */}
          <Route path="/users" element={
            <ProtectedRoute adminOnly>
              <UsersPage />
            </ProtectedRoute>
          } />
          
          {/* Redirection pour les routes inconnues */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;