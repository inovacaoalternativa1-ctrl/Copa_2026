import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import RankingPage from './pages/RankingPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import NewsPage from './pages/NewsPage';
import PartnersPage from './pages/PartnersPage';
import QuizPage from './pages/QuizPage';
import PrizesPage from './pages/PrizesPage';
import AdminAndreyPage from './pages/AdminAndreyPage';
import LuckyPredictionPage from './pages/LuckyPredictionPage';
import './App.css';

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const Admin = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

const AndreyOnly = ({ children }) => {
  const { user, isAndrey, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAndrey) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index element={<MatchesPage />} />
            <Route path="jogo/:id" element={<MatchDetailPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="noticias" element={<NewsPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="parceiros" element={<PartnersPage />} />
            <Route path="premios" element={<PrizesPage />} />
            <Route path="palpite-sorte" element={<LuckyPredictionPage />} />
            <Route path="admin" element={<Admin><AdminPage /></Admin>} />
            <Route path="admin-andrey" element={<AndreyOnly><AdminAndreyPage /></AndreyOnly>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
