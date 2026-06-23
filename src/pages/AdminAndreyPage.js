import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminGetUsers, getRanking, adminGiveBonusPoints, setLuckyResult, getLuckyResult } from '../services/api';
import { detectLuckyResult } from '../services/luckyAutoDetect';
import './AdminAndreyPage.css';

const ADMIN_PASSWORD = '33763376';
const SESSION_UNLOCK_KEY = 'copa_admin_andrey_unlocked';

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

  // Pontuação real (view "ranking" do Supabase) — id do usuário → linha do ranking
  const [rankingMap, setRankingMap] = useState({});

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [giving, setGiving] = useState(false);

  const loadRanking = () =>
    getRanking().then(({ data }) => {
      const map = {};
      (data || []).forEach(r => { map[r.user_id] = r; });
      setRankingMap(map);
    });

  useEffect(() => {
    if (!podeAcessarAdmin) return;
    setUsersLoading(true);
    setUsersError('');
    Promise.all([adminGetUsers(), loadRanking()])
      .then(([{ data, error }]) => {
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
  const selectedUserRanking = selectedUser ? rankingMap[selectedUser.id] : null;

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

  const handleGivePoints = async () => {
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
    const { error } = await adminGiveBonusPoints(selectedUser.id, value);
    if (error) {
      setAmountError(`Erro ao salvar: ${error.message}`);
      setGiving(false);
      return;
    }
    await loadRanking();
    setAmount('');
    setAmountError('');
    setSuccessMsg(`Pontos adicionados com sucesso para ${selectedUser.username || selectedUser.full_name}.`);
    setGiving(false);
  };

  // Apuração automática do Palpite da Sorte (Brasil x Escócia)
  const [luckyDetecting, setLuckyDetecting] = useState(false);
  const [luckyError, setLuckyError] = useState('');
  const [luckyPreview, setLuckyPreview] = useState(null);
  const [luckySaving, setLuckySaving] = useState(false);
  const [luckySuccess, setLuckySuccess] = useState('');
  const [luckyExisting, setLuckyExisting] = useState(null);

  useEffect(() => {
    if (!podeAcessarAdmin) return;
    getLuckyResult().then(({ data }) => setLuckyExisting(data || null));
  }, [podeAcessarAdmin]);

  const handleDetectLucky = async () => {
    setLuckyError('');
    setLuckySuccess('');
    setLuckyDetecting(true);
    try {
      const result = await detectLuckyResult();
      setLuckyPreview({
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        firstTeam: result.firstTeam || '',
        scorerName: result.scorerMatched?.name || result.scorerNameRaw || '',
        penalty: result.penalty,
        redCard: result.redCard,
        yellowCard: result.yellowCard,
        yellowTeam: result.yellowTeam || '',
        isFinished: result.isFinished,
        status: result.status,
        scorerNameRaw: result.scorerNameRaw,
        scorerMatched: result.scorerMatched,
      });
    } catch (e) {
      setLuckyError(e.message || 'Erro ao buscar resultado na API.');
    }
    setLuckyDetecting(false);
  };

  const handleManualLucky = () => {
    setLuckyError('');
    setLuckySuccess('');
    setLuckyPreview({
      scoreA: 0,
      scoreB: 0,
      firstTeam: '',
      scorerName: '',
      penalty: false,
      redCard: false,
      yellowCard: false,
      yellowTeam: '',
      isFinished: true,
      status: 'Preenchimento manual',
      scorerNameRaw: null,
      scorerMatched: null,
    });
  };

  const updateLuckyPreview = (field, value) => setLuckyPreview(prev => ({ ...prev, [field]: value }));

  const handleConfirmLucky = async () => {
    if (!luckyPreview) return;
    setLuckyError('');
    setLuckySaving(true);
    const { error } = await setLuckyResult({
      scoreA: parseInt(luckyPreview.scoreA, 10),
      scoreB: parseInt(luckyPreview.scoreB, 10),
      firstTeam: luckyPreview.firstTeam,
      scorerName: luckyPreview.scorerName,
      penalty: luckyPreview.penalty,
      redCard: luckyPreview.redCard,
      yellowCard: luckyPreview.yellowCard,
      yellowTeam: luckyPreview.yellowTeam,
      isFinished: luckyPreview.isFinished,
    });
    setLuckySaving(false);
    if (error) { setLuckyError(`Erro ao salvar: ${error.message}`); return; }
    setLuckySuccess('Resultado do Palpite da Sorte confirmado! Os pontos de todos já foram recalculados.');
    setLuckyExisting({ ...luckyPreview, score_a: luckyPreview.scoreA, score_b: luckyPreview.scoreB });
    setLuckyPreview(null);
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
        <p className="andrey-tool-hint">Os pontos são somados na coluna de extras e entram direto no ranking real.</p>

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
                  <span className="andrey-user-bonus">
                    {Number(rankingMap[u.id]?.extra_points || 0).toFixed(2)} extras
                  </span>
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
              <span className="andrey-give-current">
                Extras atuais: <strong>{Number(selectedUserRanking?.extra_points || 0).toFixed(2)}</strong>
                {' · '}
                Total atual: <strong>{Number(selectedUserRanking?.total_points || 0).toFixed(2)}</strong>
              </span>
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

      <div className="card andrey-tool-card">
        <h3 className="section-title">🍀 Apurar Palpite da Sorte (Brasil x Escócia)</h3>
        <p className="andrey-tool-hint">
          Busca o resultado real na API de futebol e calcula a pontuação de todo mundo automaticamente.
        </p>

        {luckyExisting?.is_finished && !luckyPreview && (
          <div className="alert alert-success" style={{ marginBottom: 12 }}>
            ✅ Resultado já apurado: {luckyExisting.score_a} × {luckyExisting.score_b} — pode rodar de novo se precisar corrigir.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-soft" onClick={handleDetectLucky} disabled={luckyDetecting}>
            {luckyDetecting ? 'Buscando na API...' : '🔄 Verificar resultado'}
          </button>
          <button className="btn btn-soft" onClick={handleManualLucky} disabled={luckyDetecting}>
            ✍️ Preencher manualmente
          </button>
        </div>

        {luckyError && <div className="alert alert-error" style={{ marginTop: 12 }}>{luckyError}</div>}
        {luckySuccess && <div className="alert alert-success" style={{ marginTop: 12 }}>{luckySuccess}</div>}

        {luckyPreview && (
          <div className="andrey-give-panel" style={{ marginTop: 16 }}>
            <p className="andrey-tool-hint">
              Status do jogo na API: <strong>{luckyPreview.status}</strong>
              {!luckyPreview.isFinished && ' — jogo ainda não terminou, confira antes de confirmar.'}
            </p>

            <div className="form-group">
              <label>Placar (Brasil × Escócia)</label>
              <div className="andrey-score-row">
                <input type="number" min="0" value={luckyPreview.scoreA}
                  onChange={e => updateLuckyPreview('scoreA', e.target.value)} />
                <span className="andrey-score-sep">×</span>
                <input type="number" min="0" value={luckyPreview.scoreB}
                  onChange={e => updateLuckyPreview('scoreB', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Quem marcou primeiro</label>
              <select value={luckyPreview.firstTeam} onChange={e => updateLuckyPreview('firstTeam', e.target.value)}>
                <option value="">—</option>
                <option value="brasil">Brasil</option>
                <option value="escocia">Escócia</option>
              </select>
            </div>

            <div className="form-group">
              <label>Jogador que marcou primeiro</label>
              <input type="text" value={luckyPreview.scorerName}
                onChange={e => updateLuckyPreview('scorerName', e.target.value)} />
              {!luckyPreview.scorerMatched && luckyPreview.scorerNameRaw && (
                <span className="andrey-tool-hint" style={{ display: 'block', marginTop: 4 }}>
                  ⚠️ Não consegui casar "{luckyPreview.scorerNameRaw}" com a lista de convocados — confira/corrija o nome acima.
                </span>
              )}
            </div>

            <div className="andrey-check-group">
              <label className="check-row">
                <input type="checkbox" checked={!!luckyPreview.penalty}
                  onChange={e => updateLuckyPreview('penalty', e.target.checked)} /> Houve pênalti
              </label>
              <label className="check-row">
                <input type="checkbox" checked={!!luckyPreview.redCard}
                  onChange={e => updateLuckyPreview('redCard', e.target.checked)} /> Houve cartão vermelho
              </label>
              <label className="check-row">
                <input type="checkbox" checked={!!luckyPreview.yellowCard}
                  onChange={e => updateLuckyPreview('yellowCard', e.target.checked)} /> Houve cartão amarelo
              </label>
            </div>

            <div className="form-group">
              <label>Seleção que recebeu cartão amarelo</label>
              <select value={luckyPreview.yellowTeam} onChange={e => updateLuckyPreview('yellowTeam', e.target.value)}>
                <option value="">—</option>
                <option value="brasil">Brasil</option>
                <option value="ambos">Ambos</option>
                <option value="escocia">Escócia</option>
              </select>
            </div>

            <div className="andrey-check-group" style={{ marginBottom: 20 }}>
              <label className="check-row">
                <input type="checkbox" checked={!!luckyPreview.isFinished}
                  onChange={e => updateLuckyPreview('isFinished', e.target.checked)} /> Jogo terminado (libera pontuação pra todo mundo)
              </label>
            </div>

            <button className="btn btn-primary btn-full" onClick={handleConfirmLucky} disabled={luckySaving}>
              {luckySaving ? 'Salvando...' : '✅ Confirmar resultado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
