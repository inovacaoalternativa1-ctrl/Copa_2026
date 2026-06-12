import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');
  const [ready, setReady]           = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user follows the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // If arriving with a hash token already exchanged (page reload), check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6)  { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError('Erro ao redefinir senha. Tente novamente.'); return; }
    setMsg('Senha redefinida com sucesso!');
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div className="auth-page login-split">
      <div className="login-topbar-wrap"><div className="topbar" /></div>
      <div className="split-right" style={{ flex: 1 }}>
        <div className="split-card-wrapper">
          <div className="auth-card split-card">
            <h2>Nova Senha</h2>
            <p className="auth-sub">Digite sua nova senha abaixo.</p>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {!msg && (
              !ready ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Validando link... Se a página não carregar, solicite um novo link de redefinição.
                </p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nova senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar senha</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar nova senha'}
                  </button>
                </form>
              )
            )}

            <p className="auth-footer">
              <button type="button" className="forgot-link" onClick={() => navigate('/login')}>
                ← Voltar ao login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
