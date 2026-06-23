import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminGetUsers } from '../services/api';
import './AdminAndreyPage.css';

const ADMIN_PASSWORD = '33763376';
const SESSION_UNLOCK_KEY = 'copa_admin_andrey_unlocked';
const BONUS_POINTS_KEY = 'copa_admin_andrey_bonus_points';

const loadBonusPoints = () => {
  try {
    const raw = localStorage.getItem(BONUS_POINTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveBonusPoints = (map) => {
  localStorage.setItem(BONUS_POINTS_KEY, JSON.stringify(map));
};

export default function AdminAndreyPage() {
  const { profile } = useAuth();

  // Centraliza a validação de acesso — mesma lógica usada para liberar e para
  // checar novamente antes de qualquer ação dentro da área.
  const usuarioEhAndrey = (profile?.username || '').trim().toLowerCase() === 'andrey nonardo';

  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checking, setChecking] = useState(false);

  const podeAcessarAdmin = usuarioEhAndrey && unlocked;

  // Usuários (somente leitura, para localizar quem vai receber os pontos)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bonusPoints, setBonusPoints] = useState(() => loadBonusPoints());
  const [giving, setGiving] = useState(false);

  useEffect(() => {
    if (!podeAcessarAdmin) return;
    setUsersLoading(true);
    setUsersError('');
    adminGetUsers()
      .then(({ data, error }) => {
        if (error) { setUsersError('Não foi possível carregar a lista de usuários.'); return; }
        setUsers(data || []);
      })
      .catch(() => setUsersError('Não foi possível carregar a lista de usuários.'))
      .finally(() => setUsersLoading(false));
  }, [podeAcessarAdmin]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.username || '').toLowerCase().includes(term) ||
      (u.full_name || '').toLowerCase().includes(term)
    );
  }, [users, search]);

  const selectedUser = users.find(u => String(u.id) === String(selectedUserId)) || null;
  const selectedUserPoints = selectedUser ? (bonusPoints[selectedUser.id] || 0) : 0;

  const handleUnlock = () => {
    if (!usuarioEhAndrey) { setPasswordError('Acesso não permitido.'); return; }
    setChecking(true);
    setPasswordError('');
    const senhaAdminCorreta = passwordInput === ADMIN_PASSWORD;
    if (!senhaAdminCorreta) {
      setPasswordError('Senha administrativa incorreta.');
      setChecking(false);
      return;
    }
    sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    setUnlocked(true);
    setPasswordInput('');
    setChecking(false);
  };

  const handleLockAgain = () => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setUnlocked(false);
    setSelectedUserId('');
    setAmount('');
    setSuccessMsg('');
    setAmountError('');
  };

  const handleSelectUser = (id) => {
    setSelectedUserId(id);
    setSuccessMsg('');
    setAmountError('');
  };

  const handleGivePoints = () => {
    setSuccessMsg('');

    if (!usuarioEhAndrey || !unlocked) {
      setAmountError('Acesso não permitido.');
      return;
    }
    if (!selectedUser) {
      setAmountError('Selecione um usuário antes de continuar.');
      return;
    }
    const trimmed = amount.trim();
    if (!trimmed) {
      setAmountError('Informe a quantidade de pontos.');
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setAmountError('Use apenas números inteiros positivos.');
      return;
    }
    const value = parseInt(trimmed, 10);
    if (value <= 0) {
      setAmountError('A quantidade deve ser maior que zero.');
      return;
    }

    setGiving(true);
    const current = bonusPoints[selectedUser.id] || 0;
    const updated = { ...bonusPoints, [selectedUser.id]: current + value };
    setBonusPoints(updated);
    saveBonusPoints(updated);
    setAmount('');
    setAmountError('');
    setSuccessMsg(`Pontos adicionados com sucesso para ${selectedUser.username || selectedUser.full_name}.`);
    setGiving(false);
  };

  if (!usuarioEhAndrey) {
    return null;
  }

  if (!podeAcessarAdmin) {
    return (
      <div className="andrey-lock-screen">
        <div className="card andrey-lock-card">
          <h1 className="page-title" style={{ marginBottom: 6 }}>👑 Admin Andrey</h1>
          <p className="andrey-lock-hint">Área restrita. Informe a senha administrativa para continuar.</p>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label htmlFor="andrey-admin-password">Senha administrativa</label>
            <input
              id="andrey-admin-password"
              type="password"
              autoFocus
              value={passwordInput}
              placeholder="••••••••"
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            />
          </div>

          {passwordError && <div className="alert alert-error">{passwordError}</div>}

          <button
            className="btn btn-primary btn-full"
            onClick={handleUnlock}
            disabled={checking || !passwordInput}
          >
            {checking ? 'Verificando...' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-andrey-page">
      <div className="page-header">
        <h1 className="page-title">👑 Admin Andrey</h1>
        <button className="btn btn-soft btn-sm" onClick={handleLockAgain}>Sair do Admin</button>
      </div>

      <div className="card andrey-tool-card">
        <h3 className="section-title">Dar pontos</h3>

        <div className="form-group">
          <label htmlFor="andrey-user-search">Buscar usuário</label>
          <input
            id="andrey-user-search"
            type="text"
            placeholder="Digite o nome de usuário ou nome completo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {usersLoading && <div className="andrey-users-loading"><div className="spinner-sm" /> Carregando usuários...</div>}
        {usersError && <div className="alert alert-error">{usersError}</div>}

        {!usersLoading && !usersError && (
          <div className="andrey-user-list">
            {filteredUsers.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 8px' }}>
                <span className="empty-icon">🔍</span>
                <p>Nenhum usuário encontrado.</p>
              </div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className={`andrey-user-row ${String(selectedUserId) === String(u.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(u.id)}
                >
                  <span className="andrey-user-name">{u.username || u.full_name || '—'}</span>
                  {u.full_name && u.username && <span className="andrey-user-fullname">{u.full_name}</span>}
                  <span className="andrey-user-bonus">{bonusPoints[u.id] || 0} pts (local)</span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedUser && (
          <div className="andrey-give-panel">
            <div className="andrey-give-summary">
              <span>Usuário selecionado:</span>
              <strong>{selectedUser.username || selectedUser.full_name}</strong>
              <span className="andrey-give-current">Pontuação atual (local): <strong>{selectedUserPoints}</strong></span>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label htmlFor="andrey-points-amount">Quantidade de pontos</label>
              <input
                id="andrey-points-amount"
                type="text"
                inputMode="numeric"
                placeholder="Ex: 10"
                value={amount}
                onChange={e => { setAmount(e.target.value); setAmountError(''); setSuccessMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && handleGivePoints()}
              />
            </div>

            {amountError && <div className="alert alert-error">{amountError}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <button
              className="btn btn-primary btn-full"
              onClick={handleGivePoints}
              disabled={giving}
            >
              {giving ? 'Salvando...' : 'Confirmar entrega de pontos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
