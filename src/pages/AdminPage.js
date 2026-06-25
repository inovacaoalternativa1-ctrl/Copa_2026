import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  adminGetAllTypes, adminGetUsers, adminSetMatchResult, adminValidateExtra,
  adminGetMatchScorePredictions, adminGetMatchExtraPredictions,
  adminGetExtraResults, getMatches, adminUpdateMatch,
  adminGetSponsors, adminUpsertSponsor, adminDeleteSponsor,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import { autoValidateMatchExtras } from '../services/autoExtras';
import './AdminPage.css';

const sendScorePush = (teamA, sA, sB, teamB) => {
  fetch('/.netlify/functions/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '⚽ Placar Atualizado!',
      body: `${teamA} ${sA} × ${sB} ${teamB}`,
    }),
  }).catch(() => {});
};

const PHASE_LABELS = {
  groups: 'Grupos', round_of_32: '16 Avos', round_of_16: 'Oitavas', quarterfinals: 'Quartas',
  semifinals: 'Semis', final: 'Final', third_place: '3° Lugar'
};

const flagUrl = flag => {
  if (!flag) return null;
  const pts = [...flag].map(c => c.codePointAt(0));
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF) {
    const iso = String.fromCharCode(pts[0] - 0x1F1E6 + 65) + String.fromCharCode(pts[1] - 0x1F1E6 + 65);
    return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
  }
  if (/^[A-Za-z]{2}$/.test(flag)) return `https://flagcdn.com/w40/${flag.toLowerCase()}.png`;
  return null;
};

const Flag = ({ flag, name, size = 24 }) => {
  const url = flagUrl(flag);
  const h = Math.round(size * 0.75);
  return url
    ? <img src={url} alt={name} style={{ width: size, height: h, objectFit: 'contain', borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
    : <span style={{ marginRight: 4, fontSize: size * 0.7 }}>{flag}</span>;
};

const getApplicableExtras = (extraTypes, phase) => {
  if (!phase) return extraTypes.filter(t => t.is_active);
  const isKnockout = ['round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'third_place'].includes(phase);
  const isFinal = phase === 'final';
  return extraTypes.filter(t => {
    if (!t.is_active) return false;
    if (isFinal) return t.applicable_in_final || t.applicable_in_knockout;
    if (isKnockout) return t.applicable_in_knockout;
    return t.applicable_in_groups;
  });
};

// ── ESPN sync helpers ──────────────────────────────────────────────
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard';

// ESPN 3-letter → ISO 2-letter exceptions (rest = first 2 chars)
const ESPN_TO_ISO = {
  GER:'DE', NED:'NL', SUI:'CH', POR:'PT', KOR:'KR', CRO:'HR',
  DEN:'DK', NOR:'NO', SWE:'SE', GRE:'GR', MEX:'MX', URU:'UY',
  RSA:'ZA', ALG:'DZ', CIV:'CI', ENG:'GB', WAL:'GB', SCO:'GB',
  SRB:'RS', IRN:'IR', AUS:'AU', NZL:'NZ', SAU:'SA',
};
const abbr3toISO = a => (ESPN_TO_ISO[a] || a.slice(0, 2)).toUpperCase();

const flagToISO = flag => {
  if (!flag) return null;
  const pts = [...flag].map(c => c.codePointAt(0));
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF)
    return (String.fromCharCode(pts[0] - 0x1F1E6 + 65) + String.fromCharCode(pts[1] - 0x1F1E6 + 65)).toUpperCase();
  if (/^[A-Za-z]{2}$/.test(flag)) return flag.toUpperCase();
  return null;
};

const teamsMatch = (m, homeAbbr, awayAbbr) => {
  const isoA = flagToISO(m.team_a_flag);
  const isoB = flagToISO(m.team_b_flag);
  const h = abbr3toISO(homeAbbr);
  const a = abbr3toISO(awayAbbr);
  return (isoA === h && isoB === a) || (isoA === a && isoB === h);
};
// ──────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('results');
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [extraTypes, setExtraTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoExtrasLoading, setAutoExtrasLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { ok, msg, time, syncing }

  // Results
  const [selMatchId, setSelMatchId] = useState('');
  const [resA, setResA] = useState('');
  const [resB, setResB] = useState('');
  const [roundNum, setRoundNum] = useState('');
  const [extraResults, setExtraResults] = useState({});

  // Palpites
  const [viewMatch, setViewMatch] = useState('');
  const [viewScorePreds, setViewScorePreds] = useState([]);
  const [viewExtraPreds, setViewExtraPreds] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  // Sponsors
  const [sponsors, setSponsors] = useState([]);
  const [sponsorForm, setSponsorForm] = useState({ id: null, name: '', logo_url: '', website_url: '', order_index: 0, is_active: true });
  const [sponsorEditing, setSponsorEditing] = useState(false);
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [sponsorError, setSponsorError] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadErr, setLogoUploadErr] = useState('');
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoFileRef = useRef(null);

  const loadSponsors = () => adminGetSponsors().then(({ data }) => setSponsors(data || []));

  const compressLogo = (file) => new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX)  { height = Math.round(height * MAX / width); width = MAX; }
      if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/png', 1);
    };
    img.src = objUrl;
  });

  const uploadLogo = async (file) => {
    if (!file.type.startsWith('image/')) { setLogoUploadErr('Somente imagens (JPG, PNG, SVG...).'); return; }
    setLogoUploadErr('');
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const compressed = await compressLogo(file);
    const path = `sponsors/${user.id}/${Date.now()}.png`;
    const { error } = await supabase.storage.from('post-media').upload(path, compressed, { contentType: 'image/png', upsert: false });
    if (error) { setLogoUploadErr(`Erro: ${error.message}`); setLogoUploading(false); return; }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
    setSponsorForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setLogoUploading(false);
  };

  const clearLogo = () => {
    setLogoPreview(null); setLogoUploadErr('');
    setSponsorForm(f => ({ ...f, logo_url: '' }));
    if (logoFileRef.current) logoFileRef.current.value = '';
  };

  // Keep refs to avoid stale closures inside interval/callback
  const matchesRef = useRef(matches);
  useEffect(() => { matchesRef.current = matches; }, [matches]);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const syncIntervalRef = useRef(null);

  useEffect(() => {
    Promise.all([getMatches(), adminGetAllTypes(), adminGetUsers(), adminGetSponsors()])
      .then(([{ data: m }, { data: t }, { data: u }, { data: s }]) => {
        setMatches(m || []); setExtraTypes(t || []); setUsers(u || []); setSponsors(s || []);
      }).finally(() => setLoading(false));
  }, []);

  const selMatch = matches.find(m => m.id === parseInt(selMatchId));
  const applicableExtras = selMatch ? getApplicableExtras(extraTypes, selMatch.phase) : [];

  const selectMatch = async (matchId) => {
    setSelMatchId(matchId);
    setResA('');
    setResB('');
    setExtraResults({});
    setRoundNum('');
    if (!matchId) return;
    const m = matches.find(x => x.id === parseInt(matchId));
    if (m?.is_finished) {
      setResA(String(m.score_a ?? ''));
      setResB(String(m.score_b ?? ''));
    }
    if (m?.round_number) setRoundNum(String(m.round_number));
    const { data } = await adminGetExtraResults(parseInt(matchId));
    if (data?.length) {
      const map = {};
      data.forEach(r => { if (r.official_result) map[r.extra_type_id] = r.official_result; });
      setExtraResults(map);
    }
  };

  const setER = (typeId, val) => setExtraResults(p => ({ ...p, [typeId]: val }));

  const saveAll = async () => {
    if (!selMatchId || resA === '' || resB === '') {
      setStatus({ type: 'error', msg: 'Informe o placar completo antes de salvar.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const { error: e1 } = await adminSetMatchResult(parseInt(selMatchId), parseInt(resA), parseInt(resB));
      if (e1) throw new Error(e1.message);
      sendScorePush(selMatch.team_a, parseInt(resA), parseInt(resB), selMatch.team_b);

      if (selMatch?.phase === 'groups' && roundNum) {
        const { error: e3 } = await adminUpdateMatch(parseInt(selMatchId), { round_number: parseInt(roundNum) });
        if (e3) throw new Error(e3.message);
      }

      // Auto-valida extras via API-Football
      const extrasResult = await autoValidateMatchExtras(supabase, selMatch, parseInt(resA), parseInt(resB), user.id);

      // Salva também os extras preenchidos manualmente (complementa os automáticos)
      const extraEntries = Object.entries(extraResults).filter(([k]) =>
        applicableExtras.find(t => t.id === parseInt(k))
      );
      for (const [typeId, result] of extraEntries) {
        const { error: e2 } = await adminValidateExtra(parseInt(selMatchId), parseInt(typeId), result, user.id);
        if (e2) throw new Error(e2.message);
      }

      const { data } = await getMatches();
      setMatches(data || []);
      const autoCount = extrasResult?.validated?.length || 0;
      const manualCount = extraEntries.length;
      setStatus({
        type: 'success',
        msg: `✅ Resultado ${parseInt(resA)}×${parseInt(resB)} salvo! ${autoCount} extras auto-validados${manualCount ? ` + ${manualCount} manuais` : ''}.`
      });
    } catch (e) {
      setStatus({ type: 'error', msg: `Erro: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-validar extras via Netlify function (server-side, service key) ─────
  const handleAutoExtras = async () => {
    if (!selMatch) return;
    setAutoExtrasLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/.netlify/functions/validate-extras?match_id=${selMatch.id}`);
      const result = await res.json();
      const count = result?.validated || 0;
      if (count > 0) {
        setStatus({ type: 'success', msg: `✅ ${count} extras validados via ${result.source?.toUpperCase() || 'API'}!` });
        loadMatches();
      } else {
        setStatus({ type: 'error', msg: result.error || '⚠️ Nenhum extra encontrado na API. O jogo pode não estar disponível ainda.' });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: `Erro: ${e.message}` });
    } finally {
      setAutoExtrasLoading(false);
    }
  };

  // ── Sync via Netlify function (API-Football) ─────────────────────────────
  const syncScores = useCallback(async (silent = false) => {
    if (!silent) setSyncStatus(s => ({ ...s, syncing: true }));
    const currentMatches = matchesRef.current;
    const unfinished = currentMatches.filter(m => !m.is_finished);
    if (unfinished.length === 0) {
      setSyncStatus({ ok: true, msg: 'Todos os jogos já encerrados.', time: new Date(), syncing: false });
      return;
    }
    try {
      // Chama a função Netlify diretamente — ela usa API-Football e tem a service key
      const res = await fetch('/.netlify/functions/sync-scores', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Função retornou ${res.status}`);
      const text = await res.text();
      let json = {};
      try { json = JSON.parse(text); } catch (_) { json = { body: text }; }

      const { data: freshMatches } = await getMatches();
      if (freshMatches) setMatches(freshMatches);

      const body = json.matches?.length
        ? `🎯 ${json.updated} atualizado(s): ${json.matches.join(' · ')}`
        : (json.body || 'Nenhum jogo ativo no momento.');
      setSyncStatus({ ok: true, msg: body, time: new Date(), syncing: false });
    } catch (e) {
      setSyncStatus({ ok: false, msg: `Falha na sincronização: ${e.message}`, time: new Date(), syncing: false });
    }
  }, []);

  // Auto-sync every 60s while on results tab
  useEffect(() => {
    if (tab !== 'results') return;
    syncScores(true);
    syncIntervalRef.current = setInterval(() => syncScores(true), 60000);
    return () => {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    };
  }, [tab, syncScores]);
  // ─────────────────────────────────────────────────────────────────

  const scorePreview = () => {
    if (resA === '' || resB === '' || !selMatch) return null;
    const a = parseInt(resA), b = parseInt(resB);
    if (isNaN(a) || isNaN(b)) return null;
    if (a > b) return { label: `Vitória ${selMatch.team_a}`, color: '#22c55e' };
    if (b > a) return { label: `Vitória ${selMatch.team_b}`, color: '#22c55e' };
    return { label: 'Empate', color: '#3b82f6' };
  };

  const loadMatchPredictions = async (matchId) => {
    setViewMatch(matchId);
    setViewError(null);
    setViewUser(null);
    if (!matchId) { setViewScorePreds([]); setViewExtraPreds([]); return; }
    setViewLoading(true);
    const [spRes, epRes] = await Promise.all([
      adminGetMatchScorePredictions(matchId),
      adminGetMatchExtraPredictions(matchId),
    ]);
    const errors = [spRes.error, epRes.error].filter(Boolean);
    if (errors.length) setViewError(errors.map(e => e.message).join(' | '));
    const profileMap = {};
    users.forEach(p => { profileMap[p.id] = p; });
    setViewScorePreds((spRes.data || []).map(p => ({ ...p, profile: profileMap[p.user_id] || null })));
    setViewExtraPreds((epRes.data || []).map(p => ({ ...p, profile: profileMap[p.user_id] || null })));
    setViewLoading(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const preview = scorePreview();
  const validatedCount = Object.keys(extraResults).filter(k =>
    applicableExtras.find(t => t.id === parseInt(k))
  ).length;

  const pending = matches.filter(m => !m.is_finished);
  const finished = matches.filter(m => m.is_finished);

  return (
    <div className="admin-page">
      <h1 className="page-title">⚙️ Painel Administrativo</h1>

      {status && (
        <div className={`alert alert-${status.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span>{status.msg}</span>
          <button onClick={() => setStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: .5, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {[['results', '⚽ Resultados'], ['palpites', '📊 Palpites'], ['users', '👥 Usuários'], ['parceiros', '🤝 Parceiros']].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ===== RESULTADOS ===== */}
      {tab === 'results' && (
        <div className="admin-section">

          {/* ── ESPN Sync bar ── */}
          <div className="sync-bar">
            <div className="sync-bar-left">
              <span className={`sync-dot ${syncStatus?.syncing ? 'pulsing' : syncStatus?.ok === false ? 'red' : 'green'}`} />
              {syncStatus?.syncing
                ? <span className="sync-msg">Sincronizando com ESPN...</span>
                : syncStatus
                ? <span className="sync-msg">
                    {syncStatus.msg}
                    {syncStatus.time && <span className="sync-time"> · {syncStatus.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </span>
                : <span className="sync-msg">Servidor sincroniza automaticamente a cada 1 min · <span style={{opacity:.7}}>football-data.org</span></span>
              }
            </div>
            <button
              className="sync-btn"
              onClick={() => syncScores(false)}
              disabled={syncStatus?.syncing}
            >
              {syncStatus?.syncing ? '⏳ Buscando...' : '🔄 Verificar Agora'}
            </button>
          </div>

          {/* Alerta: jogos que deveriam ter encerrado mas ainda estão pendentes */}
          {pending.filter(m => (Date.now() - new Date(m.match_date).getTime()) > 150 * 60 * 1000).map(m => (
            <div key={m.id} style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '10px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13 }}>⚠️ <strong>{m.team_a} × {m.team_b}</strong> — jogo deve ter encerrado. A API não retornou o resultado. Lance manualmente.</span>
              <button className="btn btn-sm" style={{ whiteSpace: 'nowrap', fontSize: 12 }} onClick={() => selectMatch(String(m.id))}>Lançar →</button>
            </div>
          ))}

          {/* Match selector */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Selecionar Jogo</h3>
            <select
              value={selMatchId}
              onChange={e => selectMatch(e.target.value)}
              className="admin-match-select"
            >
              <option value="">— Selecione um jogo para lançar resultado —</option>
              {pending.length > 0 && (
                <optgroup label="⏳ Pendentes">
                  {pending.map(m => (
                    <option key={m.id} value={m.id}>
                      {(Date.now() - new Date(m.match_date).getTime()) > 150 * 60 * 1000 ? '⚠️ ' : ''}{m.team_a} × {m.team_b} · {new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </optgroup>
              )}
              {finished.length > 0 && (
                <optgroup label="✅ Encerrados (editar)">
                  {finished.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.team_a} {m.score_a}×{m.score_b} {m.team_b}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Result panel */}
          {selMatch && (
            <div className="result-panel">
              {/* Header */}
              <div className="result-panel-header">
                <div className="rpanel-team">
                  <Flag flag={selMatch.team_a_flag} name={selMatch.team_a} size={34} />
                  <span>{selMatch.team_a}</span>
                </div>
                <div className="rpanel-center">
                  <div className="rpanel-vs">VS</div>
                  <div className="rpanel-meta">
                    <span>{new Date(selMatch.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="badge badge-blue" style={{ fontSize: 10, marginTop: 3 }}>{PHASE_LABELS[selMatch.phase] || selMatch.phase}</span>
                    {selMatch.venue && <span style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>{selMatch.venue}</span>}
                  </div>
                </div>
                <div className="rpanel-team right">
                  <span>{selMatch.team_b}</span>
                  <Flag flag={selMatch.team_b_flag} name={selMatch.team_b} size={34} />
                </div>
              </div>

              {/* Body: score + extras */}
              <div className="rpanel-body">
                {/* Score section */}
                <div className="rpanel-score-section">
                  <div className="rpanel-section-label">Placar Final</div>

                  <div className="rpanel-score-row">
                    <div className="rpanel-score-team-col">
                      <Flag flag={selMatch.team_a_flag} name={selMatch.team_a} size={22} />
                      <span className="rpanel-team-label">{selMatch.team_a}</span>
                      <input
                        type="number" min="0" max="20"
                        value={resA}
                        onChange={e => setResA(e.target.value)}
                        className="rpanel-score-input"
                        placeholder="0"
                      />
                    </div>
                    <span className="rpanel-score-sep">×</span>
                    <div className="rpanel-score-team-col">
                      <Flag flag={selMatch.team_b_flag} name={selMatch.team_b} size={22} />
                      <span className="rpanel-team-label">{selMatch.team_b}</span>
                      <input
                        type="number" min="0" max="20"
                        value={resB}
                        onChange={e => setResB(e.target.value)}
                        className="rpanel-score-input"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {preview && (
                    <div
                      className="score-preview-tag"
                      style={{ color: preview.color, background: preview.color + '18', border: `1px solid ${preview.color}55` }}
                    >
                      {preview.label}
                    </div>
                  )}

                  {selMatch.is_finished && (
                    <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
                      Resultado atual: {selMatch.score_a} × {selMatch.score_b}
                    </div>
                  )}
                </div>

                {/* Round selector - groups only */}
                {selMatch.phase === 'groups' && (
                  <div style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}>
                    <div className="rpanel-section-label">Rodada da Fase de Grupos</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {['1','2','3'].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRoundNum(n)}
                          style={{
                            padding: '7px 18px', borderRadius: 999,
                            border: `2px solid ${roundNum === n ? 'var(--blue)' : 'var(--line)'}`,
                            background: roundNum === n ? 'var(--blue)' : 'white',
                            color: roundNum === n ? 'white' : 'var(--muted)',
                            fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif', transition: 'all .2s',
                          }}
                        >
                          {n}ª Rodada
                        </button>
                      ))}
                    </div>
                    {!roundNum && <div style={{ fontSize: 12, color: 'var(--orange)', marginTop: 6 }}>⚠️ Selecione a rodada para incluir no ranking por rodada</div>}
                  </div>
                )}

                {/* Extras section */}
                <div className="rpanel-extras-section">
                  <div className="rpanel-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>
                      ⚡ Eventos Extras
                      {applicableExtras.length > 0 && (
                        <span className="rpanel-extras-progress">
                          {validatedCount}/{applicableExtras.length} validados
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoExtras}
                      disabled={autoExtrasLoading || !selMatch}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #004aad', background: autoExtrasLoading ? '#e8f0ff' : 'white', color: '#004aad', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {autoExtrasLoading ? '⏳ Buscando...' : '🤖 Auto-Validar Extras'}
                    </button>
                  </div>

                  {applicableExtras.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)', padding: '16px', background: 'var(--bg)', borderRadius: 12, textAlign: 'center' }}>
                      Nenhum evento extra ativo para esta fase.
                    </p>
                  ) : (
                    <div className="rpanel-extras-list">
                      {applicableExtras.map(type => {
                        const cur = extraResults[type.id];
                        const validated = cur !== undefined;
                        return (
                          <div key={type.id} className={`rpanel-extra-card${validated ? ' validated' : ''}`}>
                            <div className="rpanel-extra-header">
                              <div style={{ flex: 1 }}>
                                <div className="rpanel-extra-name">
                                  {validated ? '✅' : '⏳'} {type.name}
                                </div>
                                {type.description && (
                                  <div className="rpanel-extra-desc">{type.description}</div>
                                )}
                              </div>
                              <span className="rpanel-extra-pts">+{type.base_points}pt</span>
                            </div>
                            <div className="extra-val-choices">
                              {type.response_type === 'yes_no' && (
                                <>
                                  <button
                                    className={`choice ${cur?.answer === 'yes' ? 'active-yes' : ''}`}
                                    onClick={() => setER(type.id, { answer: 'yes' })}
                                  >Sim</button>
                                  <button
                                    className={`choice ${cur?.answer === 'no' ? 'active-no' : ''}`}
                                    onClick={() => setER(type.id, { answer: 'no' })}
                                  >Não</button>
                                </>
                              )}
                              {type.response_type === 'team_selection' && (
                                <>
                                  <button
                                    className={`choice ${cur?.team === 'A' ? 'active-yes' : ''}`}
                                    onClick={() => setER(type.id, { team: 'A' })}
                                  >
                                    <Flag flag={selMatch.team_a_flag} name={selMatch.team_a} size={16} />
                                    {selMatch.team_a}
                                  </button>
                                  <button
                                    className={`choice ${cur?.team === 'none' ? 'active-no' : ''}`}
                                    onClick={() => setER(type.id, { team: 'none' })}
                                  >Nenhum</button>
                                  <button
                                    className={`choice ${cur?.team === 'B' ? 'active-yes' : ''}`}
                                    onClick={() => setER(type.id, { team: 'B' })}
                                  >
                                    <Flag flag={selMatch.team_b_flag} name={selMatch.team_b} size={16} />
                                    {selMatch.team_b}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="rpanel-footer">
                <div className="rpanel-footer-info">
                  {selMatch.is_finished
                    ? <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>✅ Resultado já registrado — você pode corrigir</span>
                    : <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                        Palpites: <strong>{selMatch.is_locked ? '🔒 Bloqueados' : '🟢 Abertos'}</strong>
                      </span>}
                </div>
                <button
                  className="btn btn-green rpanel-save-btn"
                  onClick={saveAll}
                  disabled={saving || resA === '' || resB === ''}
                >
                  {saving
                    ? '⏳ Salvando...'
                    : `💾 ${selMatch.is_finished ? 'Atualizar' : 'Salvar'} Resultado${validatedCount > 0 ? ` + ${validatedCount} Extra${validatedCount > 1 ? 's' : ''}` : ''}`
                  }
                </button>
              </div>
            </div>
          )}

          {/* Matches table */}
          <div className="card">
            <h3 className="section-title">
              Todos os Jogos
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)', marginLeft: 8 }}>
                {finished.length} encerrados · {pending.length} pendentes
              </span>
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Jogo</th><th>Data</th><th>Fase</th><th>Status</th><th>Resultado</th><th></th></tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => { selectMatch(String(m.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ cursor: 'pointer' }}
                      className="admin-match-row"
                    >
                      <td>
                        <strong>
                          <Flag flag={m.team_a_flag} name={m.team_a} />{m.team_a}
                          <span style={{ margin: '0 6px', color: 'var(--muted)' }}>×</span>
                          <Flag flag={m.team_b_flag} name={m.team_b} />{m.team_b}
                        </strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {new Date(m.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{PHASE_LABELS[m.phase] || m.phase}</span></td>
                      <td>
                        {m.is_finished
                          ? <span className="badge badge-green">Encerrado</span>
                          : m.is_locked
                          ? <span className="badge badge-red">Bloqueado</span>
                          : <span className="badge badge-orange">Aberto</span>}
                      </td>
                      <td style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 1, color: m.is_finished ? 'var(--blue2)' : 'var(--muted)' }}>
                        {m.is_finished ? `${m.score_a} × ${m.score_b}` : '–'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {m.is_finished ? 'Editar →' : 'Lançar →'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== PALPITES ===== */}
      {tab === 'palpites' && (
        <div className="admin-section">
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Ver Palpites por Jogo</h3>
            <select value={viewMatch} onChange={e => loadMatchPredictions(e.target.value)} className="admin-match-select">
              <option value="">— Selecione um jogo —</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.is_finished ? '✅' : m.is_locked ? '🔒' : '⏳'} {m.team_a} × {m.team_b}
                  {m.is_finished ? ` (${m.score_a}×${m.score_b})` : ''}
                </option>
              ))}
            </select>
          </div>

          {viewLoading && <div className="loading-screen"><div className="spinner" /></div>}
          {viewError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              Erro: <code style={{ fontSize: 12 }}>{viewError}</code>
            </div>
          )}

          {!viewLoading && viewMatch && (() => {
            const matchData = matches.find(m => m.id === parseInt(viewMatch));
            if (viewScorePreds.length === 0) return (
              <div className="card">
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>Nenhum palpite registrado para este jogo ainda.</p>
                </div>
              </div>
            );

            const totalPts = viewScorePreds.reduce((s, p) => s + (p.points_earned || 0), 0);
            const exact = viewScorePreds.filter(p => p.points_earned === 5).length;

            return (
              <div className="card">
                {/* Summary bar */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Jogo</div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>
                      <Flag flag={matchData?.team_a_flag} name={matchData?.team_a} />
                      {matchData?.team_a} × <Flag flag={matchData?.team_b_flag} name={matchData?.team_b} />{matchData?.team_b}
                      {matchData?.is_finished && (
                        <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: 'var(--blue2)', marginLeft: 10 }}>
                          {matchData.score_a}×{matchData.score_b}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--blue2)', lineHeight: 1 }}>{viewScorePreds.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>PARTICIPANTES</div>
                  </div>
                  {matchData?.is_finished && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#22c55e', lineHeight: 1 }}>{exact}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>PLACAR EXATO</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--orange)', lineHeight: 1 }}>{totalPts}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>PTS DISTRIBUÍDOS</div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {viewScorePreds.map(sp => {
                    const uid = sp.user_id;
                    const isOpen = viewUser === uid;
                    const username = sp.profile?.username || sp.profile?.full_name || uid.slice(0, 8);
                    const userExtras = viewExtraPreds.filter(e => e.user_id === uid);
                    const pts = sp.points_earned;
                    const c = pts === 5 ? '#22c55e' : pts === 3 ? '#3b82f6' : pts === 2 ? '#f59e0b' : pts === 1 ? '#f97316' : pts === 0 ? '#ef4444' : null;
                    const lbl = pts === 5 ? 'Placar exato' : pts === 3 ? 'Vencedor/Empate' : pts === 2 ? 'Diferença de gols' : pts === 1 ? 'Gols de um time' : pts === 0 ? 'Errou' : null;

                    return (
                      <div key={uid} style={{ border: `1.5px solid ${isOpen ? 'var(--blue)' : 'var(--line)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
                        {/* Row */}
                        <div
                          onClick={() => setViewUser(isOpen ? null : uid)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: isOpen ? '#f0f5ff' : 'white', userSelect: 'none' }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--blue2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, flexShrink: 0, overflow: 'hidden' }}>
                            {sp.profile?.avatar_url
                              ? <img src={sp.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : username.slice(0, 1).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{username}</div>
                          <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 1, color: 'var(--blue2)' }}>
                            {sp.predicted_score_a} × {sp.predicted_score_b}
                          </div>
                          {lbl && (
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c + '20', color: c, border: `1px solid ${c}44`, whiteSpace: 'nowrap' }}>
                              {pts}pts · {lbl}
                            </span>
                          )}
                          {userExtras.length > 0 && (
                            <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700 }}>
                              +{userExtras.length} extra{userExtras.length > 1 ? 's' : ''}
                            </span>
                          )}
                          <span style={{ color: 'var(--muted)', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
                        </div>

                        {/* Detail panel */}
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--line)', padding: 16, background: '#fafbff' }}>
                            {matchData?.is_finished && (
                              <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid var(--line)' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Resultado Real</div>
                                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: 'var(--muted)', letterSpacing: 2 }}>{matchData.score_a} × {matchData.score_b}</div>
                                </div>
                                <div style={{ color: 'var(--line)', fontSize: 20, padding: '0 8px' }}>|</div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Palpite</div>
                                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: 'var(--blue2)', letterSpacing: 2 }}>{sp.predicted_score_a} × {sp.predicted_score_b}</div>
                                </div>
                                {lbl && (
                                  <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 999, background: c + '20', color: c, border: `1px solid ${c}44`, marginLeft: 'auto' }}>
                                    {pts} pts — {lbl}
                                  </span>
                                )}
                              </div>
                            )}
                            {userExtras.length === 0
                              ? <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>Sem palpites extras para este jogo.</p>
                              : (
                                <>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Palpites Extras</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {userExtras.map(ep => {
                                      const typeInfo = extraTypes.find(t => t.id === ep.extra_type_id);
                                      const ans = ep.predicted_answer;
                                      const ansLabel = ans?.answer === 'yes' ? 'Sim'
                                        : ans?.answer === 'no' ? 'Não'
                                        : ans?.team === 'A' ? <><Flag flag={matchData?.team_a_flag} name={matchData?.team_a} />{matchData?.team_a}</>
                                        : ans?.team === 'B' ? <><Flag flag={matchData?.team_b_flag} name={matchData?.team_b} />{matchData?.team_b}</>
                                        : ans?.team === 'none' ? 'Nenhum' : '–';
                                      const correct = ep.is_correct;
                                      return (
                                        <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'white', border: `1px solid ${correct === true ? '#86efac' : correct === false ? '#fca5a5' : 'var(--line)'}` }}>
                                          <span>{correct === true ? '✅' : correct === false ? '❌' : '⏳'}</span>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{typeInfo?.name || `Extra #${ep.extra_type_id}`}</div>
                                          </div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: correct === true ? '#22c55e' : correct === false ? '#ef4444' : 'var(--text)' }}>{ansLabel}</div>
                                          {ep.points_earned != null && (
                                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--orange)' }}>+{ep.points_earned}</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== PARCEIROS ===== */}
      {tab === 'parceiros' && (() => {
        const EMPTY_SP = { id: null, name: '', logo_url: '', website_url: '', order_index: sponsors.length, is_active: true };

        const openNew = () => {
          setSponsorForm(EMPTY_SP); setSponsorEditing(true); setSponsorError('');
          setLogoPreview(null); setLogoUploadErr('');
        };
        const openEdit = (s) => {
          setSponsorForm({ ...s }); setSponsorEditing(true); setSponsorError('');
          setLogoPreview(s.logo_url || null); setLogoUploadErr('');
        };
        const cancelEdit = () => { setSponsorEditing(false); setSponsorError(''); clearLogo(); };

        const saveSponsor = async () => {
          if (!sponsorForm.name.trim())     { setSponsorError('Nome obrigatório.'); return; }
          if (!sponsorForm.logo_url.trim()) { setSponsorError('URL da logo obrigatória.'); return; }
          setSponsorSaving(true); setSponsorError('');
          const payload = {
            name: sponsorForm.name.trim(),
            logo_url: sponsorForm.logo_url.trim(),
            website_url: sponsorForm.website_url.trim() || null,
            order_index: Number(sponsorForm.order_index) || 0,
            is_active: sponsorForm.is_active,
          };
          if (sponsorForm.id) payload.id = sponsorForm.id;
          const { error } = await adminUpsertSponsor(payload);
          if (error) { setSponsorError(error.message); setSponsorSaving(false); return; }
          await loadSponsors();
          setSponsorEditing(false);
          setSponsorSaving(false);
        };

        const deleteSponsor = async (id) => {
          if (!window.confirm('Remover este parceiro?')) return;
          await adminDeleteSponsor(id);
          await loadSponsors();
        };

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="section-title" style={{ margin: 0 }}>Logos de Parceiros ({sponsors.length})</h3>
              {!sponsorEditing && (
                <button className="btn btn-primary btn-sm" onClick={openNew}>+ Adicionar Parceiro</button>
              )}
            </div>

            {sponsorEditing && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
                  {sponsorForm.id ? 'Editar Parceiro' : 'Novo Parceiro'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Nome *</label>
                    <input type="text" value={sponsorForm.name} placeholder="Ex: Singular Engenharia"
                      onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Ordem</label>
                    <input type="number" value={sponsorForm.order_index} min="0"
                      onChange={e => setSponsorForm(f => ({ ...f, order_index: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Logo do Parceiro *</label>
                  <div
                    className={`media-drop-zone${logoDragOver ? ' drag-over' : ''}${logoUploading ? ' uploading' : ''}`}
                    style={{ minHeight: 110 }}
                    onClick={() => !logoUploading && logoFileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); setLogoDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadLogo(f); }}
                    onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
                    onDragLeave={() => setLogoDragOver(false)}
                  >
                    {logoUploading ? (
                      <div className="media-dz-uploading">
                        <div className="spinner-sm" />
                        <span>Enviando logo...</span>
                      </div>
                    ) : logoPreview ? (
                      <div className="media-dz-preview">
                        <img src={logoPreview} className="media-preview-el" alt="logo" style={{ maxHeight: 100, objectFit: 'contain', background: '#f8f8f8' }} />
                        <div className="media-dz-overlay">
                          <button className="media-dz-btn" onClick={e => { e.stopPropagation(); logoFileRef.current?.click(); }}>🔄 Trocar</button>
                          <button className="media-dz-btn danger" onClick={e => { e.stopPropagation(); clearLogo(); }}>🗑️ Remover</button>
                        </div>
                      </div>
                    ) : (
                      <div className="media-dz-empty">
                        <div className="media-dz-icon">🖼️</div>
                        <strong>Clique ou arraste a logo aqui</strong>
                        <span>PNG, JPG, SVG · Fundo transparente recomendado</span>
                      </div>
                    )}
                  </div>
                  {logoUploadErr && <p className="media-upload-err">{logoUploadErr}</p>}
                  <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files[0]; if (f) uploadLogo(f); }} />
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Link <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>— opcional, pode adicionar depois · site, Instagram, WhatsApp…</span></label>
                  <input type="text" value={sponsorForm.website_url} placeholder="Ex: https://instagram.com/singular.eng"
                    onChange={e => setSponsorForm(f => ({ ...f, website_url: e.target.value }))} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={sponsorForm.is_active}
                    onChange={e => setSponsorForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span>Ativo (visível no navbar)</span>
                </label>
                {sponsorError && <div className="alert alert-error" style={{ marginTop: 12 }}>{sponsorError}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button className="btn btn-soft btn-sm" onClick={cancelEdit}>Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={saveSponsor} disabled={sponsorSaving}>
                    {sponsorSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            )}

            {sponsors.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <span className="empty-icon">🤝</span>
                  <p>Nenhum parceiro cadastrado ainda.</p>
                  <button className="btn btn-primary btn-sm" onClick={openNew}>Adicionar primeiro parceiro</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sponsors.map(s => (
                  <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                    <div style={{ width: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', borderRadius: 8, padding: '6px 10px', flexShrink: 0 }}>
                      <img src={s.logo_url} alt={s.name} style={{ height: 34, maxWidth: 80, objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      {s.website_url && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.website_url}</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: s.is_active ? '#dcfce7' : '#fef3c7',
                      color: s.is_active ? '#16a34a' : '#b45309' }}>
                      {s.is_active ? '● Ativo' : '○ Inativo'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-soft btn-sm" onClick={() => openEdit(s)}>✏️ Editar</button>
                      <button className="btn btn-sm" style={{ background: '#fff0f0', color: 'var(--red)', border: '1px solid #fca5a5' }}
                        onClick={() => deleteSponsor(s.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ===== USUÁRIOS ===== */}
      {tab === 'users' && (
        <div className="card">
          <h3 className="section-title">Usuários ({users.length})</h3>
          {users.length === 0
            ? <div className="empty-state"><span className="empty-icon">👥</span><p>Nenhum usuário encontrado</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Usuário</th><th>Nome</th><th>WhatsApp</th><th>Cidade/UF</th><th>Instagram</th><th>Cadastro</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.username || '–'}</strong></td>
                        <td>{u.full_name || '-'}</td>
                        <td>{u.whatsapp || '-'}</td>
                        <td>{u.city && u.state ? `${u.city}/${u.state}` : u.city || u.state || '-'}</td>
                        <td>{u.instagram || '-'}</td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
