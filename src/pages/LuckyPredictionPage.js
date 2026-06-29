import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyLuckyPrediction, upsertLuckyPrediction, getLuckyRanking } from '../services/api';
import { getLuckyKickoff } from '../services/luckyAutoDetect';
import { TEAM_BRASIL, TEAM_JAPAO, POSITION_LABELS } from '../data/luckyPlayers';
import './LuckyPredictionPage.css';

const LOCK_MS_BEFORE_KICKOFF = 60 * 60 * 1000; // palpites travam 1h antes do jogo

const POINTS = {
  score: 5, scorer: 3, firstTeam: 2,
  penalty: 0.03, redCard: 0.02, yellowCard: 0.01, yellowTeam: 0.1,
  firstHalfGoal: 0.05, secondHalfGoal: 0.05, bothScore: 0.08, ownGoal: 0.05, extraTime: 0.05, penaltyShootout: 0.05,
};
const MEDALS = ['🥇', '🥈', '🥉'];

const EXTRA_QUESTIONS = [
  { key: 'penalty', label: 'Vai ter pênalti no jogo?', points: POINTS.penalty, type: 'yesno' },
  { key: 'redCard', label: 'Vai ter cartão vermelho no jogo?', points: POINTS.redCard, type: 'yesno' },
  { key: 'yellowCard', label: 'Vai ter cartão amarelo no jogo?', points: POINTS.yellowCard, type: 'yesno' },
  { key: 'yellowTeam', label: 'Qual seleção recebe cartão amarelo?', points: POINTS.yellowTeam, type: 'team3' },
  { key: 'firstHalfGoal', label: 'Vai ter gol no 1º tempo?', points: POINTS.firstHalfGoal, type: 'yesno' },
  { key: 'secondHalfGoal', label: 'Vai ter gol no 2º tempo?', points: POINTS.secondHalfGoal, type: 'yesno' },
  { key: 'bothScore', label: 'Os dois times marcam?', points: POINTS.bothScore, type: 'yesno' },
  { key: 'ownGoal', label: 'Vai ter gol contra no jogo?', points: POINTS.ownGoal, type: 'yesno' },
  { key: 'extraTime', label: 'Vai pra prorrogação?', points: POINTS.extraTime, type: 'yesno' },
  { key: 'penaltyShootout', label: 'Vai ter disputa de pênaltis?', points: POINTS.penaltyShootout, type: 'yesno' },
];

const EXTRA_ANSWER_LABEL = (q, answer) => {
  if (q.type === 'team3') {
    return answer === 'brasil' ? 'Brasil' : answer === 'japao' ? 'Japão' : 'Ambos os times';
  }
  return answer === 'yes' ? 'Sim' : 'Não';
};

const dbToSaved = (row) => ({
  scoreA: row.score_a,
  scoreB: row.score_b,
  firstTeam: row.first_team,
  scorer: { name: row.scorer_name, team: row.scorer_team },
  extras: {
    penalty: row.penalty_answer || undefined,
    redCard: row.red_card_answer || undefined,
    yellowCard: row.yellow_card_answer || undefined,
    yellowTeam: row.yellow_team_answer || undefined,
    firstHalfGoal: row.first_half_goal_answer || undefined,
    secondHalfGoal: row.second_half_goal_answer || undefined,
    bothScore: row.both_score_answer || undefined,
    ownGoal: row.own_goal_answer || undefined,
    extraTime: row.extra_time_answer || undefined,
    penaltyShootout: row.penalty_shootout_answer || undefined,
  },
});

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Bandeiras reais (flagcdn) — emojis de bandeira não renderizam corretamente no Windows.
const Flag = ({ team, size = 20 }) => {
  const src = team === 'brasil' ? 'https://flagcdn.com/w40/br.png' : 'https://flagcdn.com/w40/jp.png';
  const alt = team === 'brasil' ? 'Brasil' : 'Japão';
  return <img src={src} alt={alt} className="flag-img" style={{ width: size, height: Math.round(size * 0.75) }} />;
};

const PlayerAvatar = ({ player, size }) => (
  player.photo
    ? <img src={player.photo} alt={player.name} className="lucky-player-photo" style={{ width: size, height: size }} />
    : <span className="lucky-player-initials" style={{ width: size, height: size }}>{getInitials(player.name)}</span>
);

const PlayerNode = ({ player, selected, onSelect }) => (
  <button
    type="button"
    className={`lucky-player-node ${player.team} ${player.starter ? 'starter' : 'bench'} ${selected ? 'selected' : ''}`}
    onClick={() => onSelect(player)}
    title={player.name}
  >
    <PlayerAvatar player={player} size={40} />
    <span className="lucky-player-name">{player.name.split(' ')[0]}</span>
  </button>
);

export default function LuckyPredictionPage() {
  const { user } = useAuth();

  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [firstTeam, setFirstTeam] = useState('');
  const [scorer, setScorer] = useState(null);
  const [extras, setExtras] = useState({}); // { penalty: 'yes'|'no', redCard: 'yes'|'no' }
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);

  const [kickoff, setKickoff] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    getLuckyKickoff().then(setKickoff);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const isLocked = !!kickoff && nowTick >= new Date(kickoff).getTime() - LOCK_MS_BEFORE_KICKOFF;

  const loadRanking = () =>
    getLuckyRanking().then(({ data }) => setRanking(data || []));

  useEffect(() => {
    setRankingLoading(true);
    loadRanking().finally(() => setRankingLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingSaved(true);
    getMyLuckyPrediction(user.id)
      .then(({ data }) => {
        if (data) {
          const parsed = dbToSaved(data);
          setSaved(parsed);
          setScoreA(String(parsed.scoreA));
          setScoreB(String(parsed.scoreB));
          setFirstTeam(parsed.firstTeam);
          setScorer(parsed.scorer);
          setExtras(parsed.extras || {});
        }
      })
      .finally(() => setLoadingSaved(false));
  }, [user]);

  const myRankPos = useMemo(() => ranking.findIndex(u => u.user_id === user?.id), [ranking, user]);

  const handleSelectScorer = (player) => {
    setScorer({ id: player.id, name: player.name, team: player.team });
    setError('');
  };

  const toggleExtra = (key, answer) => {
    setExtras(prev => ({ ...prev, [key]: prev[key] === answer ? undefined : answer }));
  };

  const handleSubmit = async () => {
    setError('');
    if (isLocked) { setError('Os palpites já estão encerrados — falta menos de 1h para o jogo.'); return; }
    if (scoreA === '' || scoreB === '') { setError('Informe o placar completo.'); return; }
    if (!/^\d+$/.test(scoreA) || !/^\d+$/.test(scoreB)) { setError('O placar deve ser número inteiro positivo.'); return; }
    if (!firstTeam) { setError('Escolha quem marca primeiro: Brasil ou Japão.'); return; }
    if (!scorer) { setError('Selecione o jogador que você acha que vai marcar primeiro.'); return; }

    setSaving(true);
    const row = {
      user_id: user.id,
      score_a: parseInt(scoreA, 10),
      score_b: parseInt(scoreB, 10),
      first_team: firstTeam,
      scorer_name: scorer.name,
      scorer_team: scorer.team,
      penalty_answer: extras.penalty || null,
      red_card_answer: extras.redCard || null,
      yellow_card_answer: extras.yellowCard || null,
      yellow_team_answer: extras.yellowTeam || null,
      first_half_goal_answer: extras.firstHalfGoal || null,
      second_half_goal_answer: extras.secondHalfGoal || null,
      both_score_answer: extras.bothScore || null,
      own_goal_answer: extras.ownGoal || null,
      extra_time_answer: extras.extraTime || null,
      penalty_shootout_answer: extras.penaltyShootout || null,
      updated_at: new Date().toISOString(),
    };
    const { error: upsertErr } = await upsertLuckyPrediction(row);
    setSaving(false);
    if (upsertErr) { setError(`Erro ao salvar: ${upsertErr.message}`); return; }

    setSaved({ scoreA: row.score_a, scoreB: row.score_b, firstTeam, scorer, extras });
    loadRanking();
  };

  const handleEdit = () => { if (!isLocked) setSaved(null); };

  const renderPositionRow = (players, posKey) => (
    <div className="lucky-row" key={posKey}>
      <span className="lucky-row-tag">{POSITION_LABELS[posKey]}</span>
      <div className="lucky-row-players">
        {players.map(p => (
          <PlayerNode key={p.id} player={p} selected={scorer?.id === p.id} onSelect={handleSelectScorer} />
        ))}
      </div>
    </div>
  );

  const renderTeamBlock = (teamGroups, order) => (
    <div className="lucky-team-block">
      {order.map(pos => renderPositionRow(teamGroups[pos], pos))}
    </div>
  );

  return (
    <div className="lucky-page">
      <div className="page-header">
        <h1 className="page-title">🍀 Palpite da Sorte</h1>
        <span className="badge badge-orange">Ranking separado da Copa</span>
      </div>

      <div className="lucky-banner">
        <strong><Flag team="brasil" size={26} /> Brasil × Japão <Flag team="japao" size={26} /></strong>
        <span>Palpite único — placar exato, quem marca primeiro e qual jogador marca primeiro.</span>
      </div>

      {isLocked && (
        <div className="alert alert-error">
          🔒 Palpites encerrados — falta menos de 1h para o jogo começar (ou ele já começou).
        </div>
      )}

      {loadingSaved ? (
        <div className="loading-screen" style={{ height: 200 }}><div className="spinner" /></div>
      ) : saved ? (
        <div className="card lucky-confirm-card">
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            ✅ Palpite registrado! Boa sorte 🍀
          </div>
          <div className="lucky-confirm-row">
            <span>Placar:</span>
            <strong>{saved.scoreA} × {saved.scoreB} <span className="lucky-pts-badge">+{POINTS.score} pts</span></strong>
          </div>
          <div className="lucky-confirm-row">
            <span>Marca primeiro:</span>
            <strong><Flag team={saved.firstTeam} size={18} /> {saved.firstTeam === 'brasil' ? 'Brasil' : 'Japão'} <span className="lucky-pts-badge">+{POINTS.firstTeam} pts</span></strong>
          </div>
          <div className="lucky-confirm-row">
            <span>Jogador que marca primeiro:</span>
            <strong>{saved.scorer.name} ({saved.scorer.team === 'brasil' ? 'Brasil' : 'Japão'}) <span className="lucky-pts-badge">+{POINTS.scorer} pts</span></strong>
          </div>
          {EXTRA_QUESTIONS.filter(q => saved.extras?.[q.key]).map(q => (
            <div className="lucky-confirm-row" key={q.key}>
              <span>{q.label}</span>
              <strong>{EXTRA_ANSWER_LABEL(q, saved.extras[q.key])} <span className="lucky-pts-badge">+{q.points} pts</span></strong>
            </div>
          ))}
          <div className="lucky-confirm-row">
            <span>Total possível se acertar tudo:</span>
            <strong>{(POINTS.score + POINTS.firstTeam + POINTS.scorer + EXTRA_QUESTIONS.reduce((s, q) => s + (saved.extras?.[q.key] ? q.points : 0), 0)).toFixed(2).replace(/\.00$/, '')} pts</strong>
          </div>
          {!isLocked && (
            <button className="btn btn-soft btn-sm" style={{ marginTop: 16 }} onClick={handleEdit}>✏️ Editar palpite</button>
          )}
        </div>
      ) : isLocked ? (
        <div className="card lucky-confirm-card">
          <div className="alert alert-error">
            🔒 Os palpites foram encerrados e você não chegou a confirmar um palpite a tempo.
          </div>
        </div>
      ) : (
        <>
          {/* Tabela de pontos */}
          <div className="lucky-points-info">
            <div className="lucky-pt-item"><span>+{POINTS.score}</span><label>Placar exato</label></div>
            <div className="lucky-pt-item"><span>+{POINTS.scorer}</span><label>Jogador que marca primeiro</label></div>
            <div className="lucky-pt-item"><span>+{POINTS.firstTeam}</span><label>Time que marca primeiro</label></div>
            {EXTRA_QUESTIONS.map(q => (
              <div className="lucky-pt-item" key={q.key}><span>+{q.points}</span><label>{q.label}</label></div>
            ))}
          </div>

          {/* Placar exato */}
          <div className="card lucky-score-card">
            <h3 className="section-title">Placar exato <span className="lucky-pts-badge">+{POINTS.score} pts</span></h3>
            <div className="lucky-score-row">
              <div className="lucky-score-team">
                <span><Flag team="brasil" /> Brasil</span>
                <input type="number" min="0" max="20" value={scoreA} onChange={e => setScoreA(e.target.value)} className="lucky-score-input" placeholder="0" />
              </div>
              <span className="lucky-score-sep">×</span>
              <div className="lucky-score-team">
                <span><Flag team="japao" /> Japão</span>
                <input type="number" min="0" max="20" value={scoreB} onChange={e => setScoreB(e.target.value)} className="lucky-score-input" placeholder="0" />
              </div>
            </div>
          </div>

          {/* Quem marca primeiro */}
          <div className="card lucky-first-card">
            <h3 className="section-title">Quem marca primeiro? <span className="lucky-pts-badge">+{POINTS.firstTeam} pts</span></h3>
            <div className="lucky-first-row">
              <button className={`lucky-first-btn ${firstTeam === 'brasil' ? 'active' : ''}`} onClick={() => setFirstTeam('brasil')}>
                <Flag team="brasil" size={22} /> Brasil
              </button>
              <button className={`lucky-first-btn ${firstTeam === 'japao' ? 'active' : ''}`} onClick={() => setFirstTeam('japao')}>
                <Flag team="japao" size={22} /> Japão
              </button>
            </div>
          </div>

          {/* Escalação / jogador */}
          <div className="card lucky-pitch-card">
            <h3 className="section-title">Qual jogador marca primeiro? <span className="lucky-pts-badge">+{POINTS.scorer} pts</span></h3>
            <p className="lucky-pitch-hint">
              Todos os 26 convocados de cada seleção estão aqui, agrupados por posição.
              Anel dourado/azul = prováveis titulares. Toque em qualquer jogador pra escolher.
            </p>

            {scorer && (
              <div className="lucky-scorer-pill">
                ⚽ Seu palpite: <strong>{scorer.name}</strong> <Flag team={scorer.team} size={16} />
              </div>
            )}

            <div className="lucky-pitch">
              <div className="lucky-pitch-team-label top"><Flag team="japao" size={18} /> Japão</div>
              {renderTeamBlock(TEAM_JAPAO, ['GK', 'DEF', 'MID', 'FWD'])}
              <div className="lucky-pitch-midline" />
              {renderTeamBlock(TEAM_BRASIL, ['FWD', 'MID', 'DEF', 'GK'])}
              <div className="lucky-pitch-team-label bottom"><Flag team="brasil" size={18} /> Brasil</div>
            </div>
          </div>

          {/* Extras com pontos decimais */}
          <div className="extras-section">
            <div className="extras-header">
              <div>
                <h3>⚡ Palpites Extras</h3>
                <p>Opcionais · Pontos fracionados para desempate</p>
              </div>
            </div>
            <div className="extras-grid">
              {EXTRA_QUESTIONS.map(q => (
                <div key={q.key} className={`extra-card ${extras[q.key] ? 'has-answer' : ''}`}>
                  <div className="extra-header">
                    <span className="extra-name">{q.label}</span>
                    <span className="extra-pts">+{q.points}</span>
                  </div>
                  <div className="extra-choices">
                    {q.type === 'team3' ? (
                      <>
                        <button className={`choice ${extras[q.key] === 'brasil' ? 'active-yes' : ''}`} onClick={() => toggleExtra(q.key, 'brasil')}>
                          <Flag team="brasil" size={14} /> Brasil
                        </button>
                        <button className={`choice ${extras[q.key] === 'ambos' ? 'active-yes' : ''}`} onClick={() => toggleExtra(q.key, 'ambos')}>Ambos</button>
                        <button className={`choice ${extras[q.key] === 'japao' ? 'active-yes' : ''}`} onClick={() => toggleExtra(q.key, 'japao')}>
                          <Flag team="japao" size={14} /> Japão
                        </button>
                      </>
                    ) : (
                      <>
                        <button className={`choice ${extras[q.key] === 'yes' ? 'active-yes' : ''}`} onClick={() => toggleExtra(q.key, 'yes')}>Sim</button>
                        <button className={`choice ${extras[q.key] === 'no' ? 'active-no' : ''}`} onClick={() => toggleExtra(q.key, 'no')}>Não</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-full lucky-submit-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : '🍀 Confirmar palpite da sorte'}
          </button>
        </>
      )}

      {/* Ranking separado */}
      <div className="card lucky-ranking-card">
        <h3 className="section-title">🏆 Ranking — Palpite da Sorte</h3>
        <p className="lucky-ranking-hint">Pontuação independente do ranking geral da Copa. Todos começam zerados até o jogo terminar e os palpites serem conferidos.</p>
        {rankingLoading ? (
          <div className="loading-screen" style={{ height: 120 }}><div className="spinner" /></div>
        ) : (
          <>
            {myRankPos > -1 && (
              <div className="my-position">
                <span className="my-pos-num">#{myRankPos + 1}</span>
                <div>
                  <div className="my-pos-name">Sua posição no Palpite da Sorte</div>
                  <div className="my-pos-pts">{Number(ranking[myRankPos].total_points).toFixed(2)} pontos</div>
                </div>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Participante</th><th>Pontos</th></tr>
                </thead>
                <tbody>
                  {ranking.map((u, i) => (
                    <tr key={u.user_id} className={u.user_id === user?.id ? 'my-row' : ''}>
                      <td className="rank-pos">
                        {i < 3 ? MEDALS[i] : <span className="rank-num">{i + 1}</span>}
                      </td>
                      <td>
                        <div className="rank-user">
                          {u.user_id === user?.id && <span className="you-tag">Você</span>}
                          <span className="rank-username">{u.username || u.full_name}</span>
                        </div>
                      </td>
                      <td className="rank-total">{Number(u.total_points).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
