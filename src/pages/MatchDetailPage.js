import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatch, getScorePredictions, upsertScorePrediction, getExtraTypes, getExtraPredictions, upsertExtraPrediction, deleteExtraPrediction } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SocialGateModal from '../components/SocialGateModal';
import './MatchDetailPage.css';

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

const Flag = ({ flag, name }) => {
  const url = flagUrl(flag);
  return url
    ? <img src={url} alt={name} style={{width:24,height:18,objectFit:'contain',borderRadius:2,verticalAlign:'middle',marginRight:4}} />
    : <span style={{marginRight:4}}>{flag}</span>;
};

const PHASES = { groups:'Fase de Grupos', round_of_16:'Oitavas de Final', quarterfinals:'Quartas de Final', semifinals:'Semifinal', final:'Final' };
const POINTS_TABLE = [
  { pts: 5, label: 'Placar exato' },
  { pts: 3, label: 'Vencedor/Empate' },
  { pts: 2, label: 'Diferença de gols' },
  { pts: 1, label: 'Gols de uma equipe' },
];

const SCORE_STATUS = {
  5: { label: 'Placar exato!',        color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  3: { label: 'Acertou o vencedor',   color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  2: { label: 'Acertou a diferença',  color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  1: { label: 'Acertou gols de 1 time', color: '#f97316', bg: '#ffedd5', border: '#fdba74' },
  0: { label: 'Não acertou',          color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
};

export default function MatchDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGate, setShowGate] = useState(() =>
    user ? !localStorage.getItem(`copa2026_social_ok_${user.id}`) : false
  );
  const [match, setMatch] = useState(null);
  const [scorePred, setScorePred] = useState(null); // full record
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [extras, setExtras] = useState([]);
  const [userExtras, setUserExtras] = useState({});     // typeId -> answer (for editing)
  const [extraPreds, setExtraPreds] = useState([]);     // full records (for result display)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const initialExtrasRef = useRef({});

  useEffect(() => {
    Promise.all([
      getMatch(id),
      getScorePredictions(id, user.id),
      getExtraTypes('groups'),
      getExtraPredictions(id, user.id)
    ]).then(([{data:m}, {data:sp}, {data:et}, {data:ep}]) => {
      setMatch(m);
      if (sp) {
        setScorePred(sp);
        setScoreA(String(sp.predicted_score_a ?? 0));
        setScoreB(String(sp.predicted_score_b ?? 0));
      }
      setExtras(et || []);
      setExtraPreds(ep || []);
      const map = {};
      (ep||[]).forEach(p => { map[p.extra_type_id] = p.predicted_answer; });
      setUserExtras(map);
      initialExtrasRef.current = { ...map };
    }).finally(() => setLoading(false));
  }, [id, user.id]);

  const toggleExtra = (typeId, answer) => {
    const current = userExtras[typeId];
    const isSame = JSON.stringify(current) === JSON.stringify(answer);
    if (isSame) {
      setUserExtras(p => { const n = {...p}; delete n[typeId]; return n; });
    } else {
      setUserExtras(p => ({...p, [typeId]: answer}));
    }
  };

  const saveAll = async () => {
    if (scoreA === '' || scoreB === '') {
      setStatus({type:'error',msg:'Informe o placar antes de salvar'});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true); setStatus(null);

    const { error: scoreErr } = await upsertScorePrediction(user.id, id, parseInt(scoreA), parseInt(scoreB));
    if (scoreErr) {
      setStatus({type:'error',msg:`Erro: ${scoreErr.message}`});
      setSaving(false);
      return;
    }

    for (const [typeId, answer] of Object.entries(userExtras)) {
      await upsertExtraPrediction(user.id, id, parseInt(typeId), answer);
    }
    for (const typeId of Object.keys(initialExtrasRef.current)) {
      if (!(typeId in userExtras)) {
        await deleteExtraPrediction(user.id, id, parseInt(typeId));
      }
    }

    initialExtrasRef.current = { ...userExtras };
    setSaving(false);
    navigate('/');
  };

  const estimatedExtras = Object.keys(userExtras).reduce((s, tid) => {
    const t = extras.find(e => e.id === parseInt(tid));
    return s + (t?.base_points || 0);
  }, 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!match) return <div className="empty-state"><span className="empty-icon">❌</span><p>Jogo não encontrado</p></div>;

  const matchDate = new Date(match.match_date).getTime();
  const autoLocked = Date.now() >= matchDate - 5 * 60 * 1000;
  const locked = match.is_locked || match.is_finished || autoLocked;

  // Result data
  const scoreStatus = match.is_finished && scorePred?.is_calculated
    ? SCORE_STATUS[scorePred.points_earned] || null
    : null;
  const totalExtraPoints = extraPreds.reduce((s, p) => s + (p.points_earned || 0), 0);
  const totalPoints = (scorePred?.points_earned || 0) + totalExtraPoints;

  return (
    <div className="match-detail">
      {showGate && user && (
        <SocialGateModal userId={user.id} onConfirmed={() => setShowGate(false)} />
      )}
      <Link to="/" className="back-link">← Voltar</Link>

      {/* Hero */}
      <div className="match-hero">
        <div className="hero-badges">
          <span className="badge badge-orange">{PHASES[match.phase]}</span>
          {match.group_name && <span className="badge badge-gray">Grupo {match.group_name}</span>}
          {match.is_finished && <span className="badge badge-green">✓ Encerrado</span>}
          {(match.is_locked || autoLocked) && !match.is_finished && <span className="badge badge-red">🔒 Bloqueado</span>}
        </div>
        <div className="hero-teams">
          <div className="hero-team">
            {flagUrl(match.team_a_flag)
              ? <img src={flagUrl(match.team_a_flag)} alt={match.team_a} className="hero-flag-img" />
              : <span className="hero-flag">{match.team_a_flag}</span>}
            <span className="hero-name">{match.team_a}</span>
          </div>
          <div className="hero-center">
            {match.is_finished
              ? <div className="hero-score">{match.score_a} <span>×</span> {match.score_b}</div>
              : <div className="hero-vs">VS</div>}
            <div className="hero-date">
              {new Date(match.match_date).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}
            </div>
            {match.venue && <div className="hero-venue">📍 {match.venue}</div>}
          </div>
          <div className="hero-team">
            {flagUrl(match.team_b_flag)
              ? <img src={flagUrl(match.team_b_flag)} alt={match.team_b} className="hero-flag-img" />
              : <span className="hero-flag">{match.team_b_flag}</span>}
            <span className="hero-name">{match.team_b}</span>
          </div>
        </div>
      </div>

      {/* ── RESULTADO DO PALPITE (jogo encerrado) ── */}
      {match.is_finished && scorePred && (
        <div className="result-card">
          <div className="result-header">
            <span className="result-title">Seu Resultado</span>
            {scoreStatus && (
              <span className="result-badge" style={{background: scoreStatus.bg, color: scoreStatus.color, border: `1px solid ${scoreStatus.border}`}}>
                {scoreStatus.label}
              </span>
            )}
            {!scorePred.is_calculated && (
              <span className="result-badge" style={{background:'#f3f4f6',color:'#6b7280',border:'1px solid #d1d5db'}}>
                ⏳ Aguardando cálculo
              </span>
            )}
          </div>

          {/* Comparação placar */}
          <div className="result-scores">
            <div className="result-score-block">
              <div className="result-score-label">Seu palpite</div>
              <div className="result-score-value" style={{color: scoreStatus?.color || 'var(--blue2)'}}>
                {scorePred.predicted_score_a} × {scorePred.predicted_score_b}
              </div>
            </div>
            <div className="result-score-sep">VS</div>
            <div className="result-score-block">
              <div className="result-score-label">Resultado real</div>
              <div className="result-score-value" style={{color:'var(--muted)'}}>
                {match.score_a} × {match.score_b}
              </div>
            </div>
            <div className="result-pts-box">
              <div className="result-pts-num">{scorePred.is_calculated ? scorePred.points_earned : '–'}</div>
              <div className="result-pts-label">pts placar</div>
            </div>
          </div>

          {/* Extras resultado */}
          {extraPreds.length > 0 && (
            <div className="result-extras">
              <div className="result-extras-title">⚡ Extras</div>
              <div className="result-extras-list">
                {extraPreds.map(ep => {
                  const typeInfo = extras.find(t => t.id === ep.extra_type_id);
                  const ans = ep.predicted_answer;
                  const ansLabel = ans?.answer === 'yes' ? 'Sim'
                    : ans?.answer === 'no' ? 'Não'
                    : ans?.team === 'A' ? match.team_a
                    : ans?.team === 'B' ? match.team_b
                    : ans?.team === 'none' ? 'Nenhum' : '–';
                  const c = ep.is_correct;
                  return (
                    <div key={ep.id} className="result-extra-row" style={{
                      borderColor: c === true ? '#86efac' : c === false ? '#fca5a5' : 'var(--line)',
                      background: c === true ? '#f0fdf4' : c === false ? '#fff1f2' : 'white',
                    }}>
                      <span className="result-extra-icon">{c === true ? '✅' : c === false ? '❌' : '⏳'}</span>
                      <div className="result-extra-info">
                        <span className="result-extra-name">{typeInfo?.name || `Extra #${ep.extra_type_id}`}</span>
                        <span className="result-extra-ans">{ansLabel}</span>
                      </div>
                      <span className="result-extra-pts" style={{color: c === true ? '#22c55e' : c === false ? '#ef4444' : 'var(--muted)'}}>
                        {c === true ? `+${ep.points_earned}` : c === false ? '0' : '–'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="result-total">
                <span>Total neste jogo</span>
                <span className="result-total-pts">{scorePred.is_calculated ? totalPoints.toFixed(2) : '–'} pts</span>
              </div>
            </div>
          )}

          {!extraPreds.length && scorePred.is_calculated && (
            <div className="result-total">
              <span>Total neste jogo</span>
              <span className="result-total-pts">{scorePred.points_earned} pts</span>
            </div>
          )}
        </div>
      )}

      {/* Points table (só quando jogo não encerrado) */}
      {!match.is_finished && (
        <div className="points-info">
          {POINTS_TABLE.map(p => <div key={p.pts} className="pt-item"><span>{p.pts}pts</span><label>{p.label}</label></div>)}
        </div>
      )}

      {/* Placar */}
      <div className="card score-tab">
        <h3>Palpite de Placar</h3>
        {locked
          ? (
            <div className="locked-score-display">
              {scorePred
                ? <div className="locked-score-value">{scorePred.predicted_score_a} <span>×</span> {scorePred.predicted_score_b}</div>
                : <div className="locked-msg">🔒 {match.is_finished ? 'Sem palpite registrado' : autoLocked ? 'Palpites encerrados — jogo começa em menos de 5 minutos' : 'Palpites bloqueados'}</div>}
              {!scorePred && (match.is_locked || autoLocked) && !match.is_finished &&
                <div className="locked-msg" style={{marginTop:8}}>🔒 {autoLocked ? 'Palpites encerrados — jogo começa em menos de 5 minutos' : 'Palpites bloqueados'}</div>}
            </div>
          )
          : (
            <div className="score-input-area">
              <div className="score-team">
                <span><Flag flag={match.team_a_flag} name={match.team_a} />{match.team_a}</span>
                <input type="number" min="0" max="20" value={scoreA} onChange={e=>setScoreA(e.target.value)} className="score-input" />
              </div>
              <div className="score-sep">×</div>
              <div className="score-team">
                <span><Flag flag={match.team_b_flag} name={match.team_b} />{match.team_b}</span>
                <input type="number" min="0" max="20" value={scoreB} onChange={e=>setScoreB(e.target.value)} className="score-input" />
              </div>
            </div>
          )}
      </div>

      {/* Extras */}
      {extras.length > 0 && (
        <div className="extras-section">
          <div className="extras-header">
            <div>
              <h3>⚡ Palpites Extras</h3>
              <p>Opcionais · Pontos fracionados para desempate</p>
            </div>
            {!locked && Object.keys(userExtras).length > 0 && (
              <div className="extras-pts">+{estimatedExtras.toFixed(2)} pts estimados</div>
            )}
          </div>
          <div className="extras-grid">
            {extras.map(type => {
              const sel = userExtras[type.id];
              const fullPred = extraPreds.find(p => p.extra_type_id === type.id);
              return (
                <div key={type.id} className={`extra-card ${sel ? 'has-answer' : ''}`}>
                  <div className="extra-header">
                    <span className="extra-name">{type.name}</span>
                    <span className="extra-pts">+{type.base_points}</span>
                  </div>
                  {type.description && <p className="extra-desc">{type.description}</p>}
                  {!locked && (
                    <div className="extra-choices">
                      {type.response_type === 'yes_no' && (
                        <>
                          <button className={`choice ${sel?.answer==='yes'?'active-yes':''}`} onClick={()=>toggleExtra(type.id,{answer:'yes'})}>Sim</button>
                          <button className={`choice ${sel?.answer==='no'?'active-no':''}`} onClick={()=>toggleExtra(type.id,{answer:'no'})}>Não</button>
                        </>
                      )}
                      {type.response_type === 'team_selection' && (
                        <>
                          <button className={`choice ${sel?.team==='A'?'active-yes':''}`} onClick={()=>toggleExtra(type.id,{team:'A'})}><Flag flag={match.team_a_flag} name={match.team_a} />{match.team_a}</button>
                          <button className={`choice ${sel?.team==='none'?'active-no':''}`} onClick={()=>toggleExtra(type.id,{team:'none'})}>Nenhum</button>
                          <button className={`choice ${sel?.team==='B'?'active-yes':''}`} onClick={()=>toggleExtra(type.id,{team:'B'})}><Flag flag={match.team_b_flag} name={match.team_b} />{match.team_b}</button>
                        </>
                      )}
                    </div>
                  )}
                  {locked && sel && !match.is_finished && (
                    <div className="extra-answer">
                      ✓ {sel.answer === 'yes' ? 'Sim' : sel.answer === 'no' ? 'Não' : sel.team === 'A' ? match.team_a : sel.team === 'B' ? match.team_b : 'Nenhum'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão salvar */}
      {!locked && (
        <div style={{marginTop: 8}}>
          {status && <div className={`alert alert-${status.type}`} style={{marginBottom: 10}}>{status.msg}</div>}
          <button className="btn btn-primary btn-save-all" onClick={saveAll} disabled={saving}>
            {saving ? 'Salvando...' : '💾 Salvar Palpite'}
          </button>
        </div>
      )}
    </div>
  );
}
