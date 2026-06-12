import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import './AuthPage.css';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn(email, password); navigate('/'); }
    catch { setError('Email ou senha inválidos'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true); setForgotMsg('');
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
    setForgotLoading(false);
    if (err) setForgotMsg('Erro ao enviar email. Verifique o endereço e tente novamente.');
    else setForgotMsg('Link enviado! Verifique sua caixa de entrada.');
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

        {/* ── MOBILE HERO (oculto no desktop) ── */}
        <div className="mobile-login-hero">
          <div className="mobile-brand-row">
            <video
              className="mobile-ava-video"
              src="/videos/ava-copa-bandeira.mp4"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
            />
            <div className="mobile-brand-name">
              <span className="mobile-brand-main">Alternativa</span>
              <span className="mobile-brand-sub">Serviços</span>
            </div>
          </div>
          <div className="mobile-copa-brand">
            <span className="mobile-copa-title">Copa Simulada</span>
            <span className="mobile-copa-year">2026</span>
          </div>
          <div className="mobile-copa-stats">
            <div><strong>48</strong><span>Seleções</span></div>
            <div><strong>64</strong><span>Jogos</span></div>
            <div><strong>+500</strong><span>Participantes</span></div>
          </div>
        </div>

        <div className="split-card-wrapper">
          <div className="auth-card split-card">
            {!showForgot ? (
              <>
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
                    <button type="button" className="forgot-link" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(''); }}>
                      Esqueceu a senha?
                    </button>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
                <p className="auth-footer">Não tem conta? <Link to="/cadastro">Cadastre-se grátis</Link></p>
              </>
            ) : (
              <>
                <h2>Redefinir Senha</h2>
                <p className="auth-sub">Enviaremos um link para seu email.</p>
                {forgotMsg && (
                  <div className={`alert ${forgotMsg.startsWith('Link') ? 'alert-success' : 'alert-error'}`}>
                    {forgotMsg}
                  </div>
                )}
                {!forgotMsg.startsWith('Link') && (
                  <form onSubmit={handleForgot}>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="seu@email.com" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={forgotLoading}>
                      {forgotLoading ? 'Enviando...' : 'Enviar link'}
                    </button>
                  </form>
                )}
                <p className="auth-footer">
                  <button type="button" className="forgot-link" onClick={() => { setShowForgot(false); setForgotMsg(''); }}>
                    ← Voltar ao login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
