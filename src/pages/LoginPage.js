import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn(email, password); navigate('/'); }
    catch { setError('Email ou senha inválidos'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page login-split">
      <div className="login-topbar-wrap"><div className="topbar" /></div>

      {/* ── LADO ESQUERDO 60% ── */}
      <div className="split-left">
        <div className="auth-left">
          <div className="auth-brand-row">
            <video
                className="auth-logo-video"
                src="/videos/ava-copa-bandeira.mp4"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              />
            <div className="auth-brand-name">
              <span className="auth-brand-main">Alternativa</span>
              <span className="auth-brand-sub-name">Serviços</span>
            </div>
          </div>
          <h1>Copa Simulada<br /><span>2026</span></h1>
          <p>Palpite nos jogos, acumule pontos e concorra a prêmios incríveis!</p>
          <div className="auth-stats">
            <div><strong>48</strong><span>Seleções</span></div>
            <div><strong>64</strong><span>Jogos</span></div>
            <div><strong>+500</strong><span>Participantes</span></div>
          </div>
        </div>
      </div>

      {/* ── LADO DIREITO 40% — vídeo + card ── */}
      <div className="split-right">
        <video
          className="split-video"
          src="/videos/vinheta-copa.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="split-overlay" />
        <div className="split-card-wrapper">
          <div className="auth-card split-card">
            <h2>Entrar</h2>
            <p className="auth-sub">Bem-vindo de volta!</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <p className="auth-footer">Não tem conta? <Link to="/cadastro">Cadastre-se grátis</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
