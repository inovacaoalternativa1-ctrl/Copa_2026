import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username:'', full_name:'', email:'', password:'', whatsapp:'', cpf:'', city:'', state:'', instagram:'', terms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({...p, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.terms) { setError('Aceite os termos de uso para continuar'); return; }
    if (form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres'); return; }
    setLoading(true);
    try { await signUp(form); navigate('/'); }
    catch (err) { setError(err.message || 'Erro ao criar conta'); }
    finally { setLoading(false); }
  };

  const brasilian_states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div className="auth-page register">
      <div className="topbar" />
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand-row">
            <div className="auth-logo">🏆</div>
            <div className="auth-brand-name">
              <span className="auth-brand-main">Alternativa</span>
              <span className="auth-brand-sub-name">Serviços</span>
            </div>
          </div>
          <h1>Participe<br/><span>do Bolão!</span></h1>
          <p>Cadastro gratuito. Faça seus palpites e dispute o ranking com milhares de torcedores.</p>
          <div className="points-preview">
            <div className="points-item"><span>5 pts</span><label>Placar exato</label></div>
            <div className="points-item"><span>3 pts</span><label>Vencedor certo</label></div>
            <div className="points-item"><span>+0.05</span><label>Extras</label></div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card wide">
            <h2>Criar Conta</h2>
            <p className="auth-sub">Participação gratuita · Dados seguros</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Nome de usuário *</label><input value={form.username} onChange={e=>set('username',e.target.value)} placeholder="seu_nick" required /></div>
                <div className="form-group"><label>Nome completo *</label><input value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="João Silva" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" required /></div>
                <div className="form-group"><label>Senha *</label><input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Mínimo 6 caracteres" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>WhatsApp *</label><input value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)} placeholder="(11) 99999-9999" required /></div>
                <div className="form-group"><label>CPF <span className="optional">(opcional para premiação)</span></label><input value={form.cpf} onChange={e=>set('cpf',e.target.value)} placeholder="000.000.000-00" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cidade *</label><input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="São Paulo" required /></div>
                <div className="form-group"><label>Estado *</label>
                  <select value={form.state} onChange={e=>set('state',e.target.value)} required>
                    <option value="">Selecione</option>
                    {brasilian_states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Instagram <span className="optional">(opcional)</span></label><input value={form.instagram} onChange={e=>set('instagram',e.target.value)} placeholder="@seu_instagram" /></div>
              <label className="check-row terms-check">
                <input type="checkbox" checked={form.terms} onChange={e=>set('terms',e.target.checked)} />
                Aceito os <a href="#termos">termos de uso</a>, política de privacidade e regulamento do bolão
              </label>
              <button type="submit" className="btn btn-primary btn-full" style={{marginTop:16}} disabled={loading}>{loading ? 'Criando conta...' : 'Criar Conta Grátis'}</button>
            </form>
            <p className="auth-footer">Já tem conta? <Link to="/login">Entrar</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
