import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, getUserAllScorePredictions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import { syncLiveScores } from '../services/syncScores';
import './MatchesPage.css';

const PHASES = { groups:'Fase de Grupos', round_of_32:'16 Avos', round_of_16:'Oitavas', quarterfinals:'Quartas', semifinals:'Semifinal', final:'Final' };

// Converts flag emoji or ISO code to a flagcdn.com image URL.
// Handles: standard country flags (🇧🇷), subdivision flags (🏴󠁧󠁢󠁳󠁣󠁴󠁿), and plain ISO codes (BR).
const flagUrl = flag => {
  if (!flag) return null;
  const pts = [...flag].map(c => c.codePointAt(0));

  // Standard country flag emoji via Regional Indicators: 🇧🇷 → "br"
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF) {
    const iso = String.fromCharCode(pts[0] - 0x1F1E6 + 65) + String.fromCharCode(pts[1] - 0x1F1E6 + 65);
    return `https://flagcdn.com/w80/${iso.toLowerCase()}.png`;
  }

  // Subdivision flag emoji via tag sequences: 🏴󠁧󠁢󠁳󠁣󠁴󠁿 → "gb-sct"
  if (pts[0] === 0x1F3F4) {
    const code = pts.slice(1)
      .filter(p => p >= 0xE0061 && p <= 0xE007A)
      .map(p => String.fromCharCode(p - 0xE0000))
      .join('');
    // code = "gbsct" → "gb-sct"
    const iso = code.slice(0, 2) + '-' + code.slice(2);
    return `https://flagcdn.com/w80/${iso}.png`;
  }

  // Plain 2-letter ISO code: "BR" → "br"
  if (/^[A-Za-z]{2}$/.test(flag)) {
    return `https://flagcdn.com/w80/${flag.toLowerCase()}.png`;
  }

  return null;
};

const SYNC_INTERVAL_MS = 60_000; // respect 10 req/min API limit

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [liveIds, setLiveIds] = useState(new Set());
  const intervalRef = useRef(null);
  const matchesRef = useRef([]); // ref para o sync sempre ver os matches atuais

  const loadMatches = () => getMatches().then(({ data }) => {
    const list = data || [];
    matchesRef.current = list;
    setMatches(list);
  });

  useEffect(() => {
    const init = async () => {
      await loadMatches();
      if (user) {
        const { data } = await getUserAllScorePredictions(user.id);
        if (data) {
          const map = {};
          data.forEach(p => { map[p.match_id] = p; });
          setPredictions(map);
        }
      }
      setLoading(false);
    };
    init();
  }, [user]);


  useEffect(() => {
    const sync = async () => {
      try {
        const ids = await syncLiveScores(supabase);
        console.log('[LiveSync] tick — jogos ao vivo:', ids.size, [...ids]);
        if (ids.size > 0) { setLiveIds(ids); loadMatches(); }
      } catch (e) {
        console.error('[LiveSync] erro:', e.message);
      }
    };

    sync();
    intervalRef.current = setInterval(sync, SYNC_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const filtered = filter === 'all' ? matches : matches.filter(m => m.phase === filter);
  const grouped = filtered.reduce((acc, m) => { const k = m.phase; acc[k]=(acc[k]||[]); acc[k].push(m); return acc; }, {});

  const fmtDate = d => new Date(d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="matches-page">
      <div className="page-header">
        <h1 className="page-title">⚽ Jogos</h1>
        <div className="phase-filter">
          {['all','groups','round_of_32','round_of_16','quarterfinals','semifinals','final'].map(f => (
            <button key={f} className={`filter-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
              {f==='all'?'Todos':PHASES[f]}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grouped).map(([phase, ms]) => (
        <div key={phase} className="phase-group">
          <div className="phase-label">{PHASES[phase]||phase}</div>
          <div className="matches-grid">
            {ms.map(m => (
              <Link to={`/jogo/${m.id}`} key={m.id} className={`match-card ${m.is_finished?'finished':''} ${m.is_locked&&!m.is_finished?'locked':''} ${liveIds.has(m.id)?'live':''}`}>
                <div className="match-card-top">
                  <span className="badge badge-orange">{PHASES[m.phase]}</span>
                  {m.group_name && <span className="badge badge-gray">Grupo {m.group_name}</span>}
                  {liveIds.has(m.id) && <span className="badge badge-live">🔴 AO VIVO</span>}
                  {m.is_finished && <span className="badge badge-green">✓ Encerrado</span>}
                  {m.is_locked && !m.is_finished && !liveIds.has(m.id) && <span className="badge badge-red">🔒 Bloqueado</span>}
                </div>
                <div className="match-teams">
                  <div className="match-team">
                    <span className="team-flag">
                      {flagUrl(m.team_a_flag)
                        ? <img src={flagUrl(m.team_a_flag)} alt={m.team_a} />
                        : m.team_a_flag}
                    </span>
                    <span className="team-name">{m.team_a}</span>
                  </div>
                  <div className="match-vs">
                    {m.is_finished || liveIds.has(m.id)
                      ? <span className={`score ${liveIds.has(m.id) ? 'score-live' : ''}`}>{m.score_a} × {m.score_b}</span>
                      : <span className="vs">VS</span>}
                  </div>
                  <div className="match-team right">
                    <span className="team-flag">
                      {flagUrl(m.team_b_flag)
                        ? <img src={flagUrl(m.team_b_flag)} alt={m.team_b} />
                        : m.team_b_flag}
                    </span>
                    <span className="team-name">{m.team_b}</span>
                  </div>
                </div>
                <div className="match-meta">
                  <span>📅 {fmtDate(m.match_date)}</span>
                  {m.venue && <span>📍 {m.venue}</span>}
                </div>
                {predictions[m.id] && (
                  <div className="match-prediction-badge">
                    <span className="match-prediction-label">Meu palpite</span>
                    <span className="match-prediction-score">
                      {predictions[m.id].predicted_score_a} × {predictions[m.id].predicted_score_b}
                    </span>
                  </div>
                )}
                {!m.is_locked && !predictions[m.id] && <div className="match-cta">Palpitar agora →</div>}
                {!m.is_locked && predictions[m.id] && <div className="match-cta">Editar palpite →</div>}
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div className="empty-state"><span className="empty-icon">🏟️</span><p>Nenhum jogo encontrado</p></div>}
    </div>
  );
}
