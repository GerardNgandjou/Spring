// TestAuth.tsx
import React from 'react';
import { useAuth } from './AuthContext';

const TestAuth: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  return (
    <div>
      <h1>Test Auth</h1>
      <p>User: {user ? user.email : 'Non connecté'}</p>
    </div>
  );
};

export default TestAuth;