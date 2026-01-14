import './App.css'
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import NavBar from "./components/ui/NavBar.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginForm from "./components/auth/LoginForm.tsx";
import RegisterForm from "./components/auth/RegisterForm.tsx";
import ProtectedRoute from "./components/ui/ProtectedRoute.tsx";
import RecipeList from "./components/recipes/RecipeList.tsx";
import { register } from './services/api';
import { useEffect } from 'react';

function App() {

    useEffect(() => {
    register()
      .then(data => {
        console.log('Registered:', data);
      })
      .catch(err => {
        console.error('Register error:', err);
      });
  }, []); // ← runs once on app load

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100">
                <NavBar/>
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/login" element={<LoginForm/>}/>
                        <Route path="/register" element={<RegisterForm/>}/>
                        <Route
                            path="/recipes"
                            element={
                                <ProtectedRoute>
                                  <RecipeList />
                                </ProtectedRoute>
                            }/>
                      <Route path="*" element={<Navigate to="/" replace /> } />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}

export default App
