import React, { useState, useEffect, useMemo } from 'react';
import { getRanking, getRoundRanking, getPhaseRanking } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './RankingPage.css';

const MEDALS = ['🥇','🥈','🥉'];

const TABS = [
  { key: 'geral',          label: '🏆 Geral' },
  { key: '1',              label: '1ª Rodada' },
  { key: '2',              label: '2ª Rodada' },
  { key: '3',              label: '3ª Rodada' },
  { key: 'round_of_16',   label: 'Oitavas' },
  { key: 'quarterfinals', label: 'Quartas' },
  { key: 'semifinals',    label: 'Semifinal' },
  { key: 'final',         label: '🏅 Final' },
];

const TAB_LABEL = {
  '1': '1ª Rodada', '2': '2ª Rodada', '3': '3ª Rodada',
  round_of_16: 'Oitavas de Final', quarterfinals: 'Quartas de Final',
  semifinals: 'Semifinal', final: 'Final',
};

const GROUP_ROUNDS = ['1', '2', '3'];
const KNOCKOUT_PHASES = ['round_of_16', 'quarterfinals', 'semifinals', 'final'];

const EMPTY_PHASES = {
  round_of_16: [], quarterfinals: [], semifinals: [], final: [],
};

export default function RankingPage() {
  const [ranking, setRanking]           = useState([]);
  const [roundRankings, setRoundRankings] = useState({ 1: [], 2: [], 3: [] });
  const [phaseRankings, setPhaseRankings] = useState(EMPTY_PHASES);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('geral');
  const { profile } = useAuth();

  useEffect(() => {
    const load = async () => {
      const [geral, r1, r2, r3, ro16, qf, sf, fin] = await Promise.all([
        getRanking(),
        getRoundRanking(1), getRoundRanking(2), getRoundRanking(3),
        getPhaseRanking('round_of_16'), getPhaseRanking('quarterfinals'),
        getPhaseRanking('semifinals'),  getPhaseRanking('final'),
      ]);
      setRanking(geral.data || []);
      setRoundRankings({ 1: r1.data || [], 2: r2.data || [], 3: r3.data || [] });
      setPhaseRankings({
        round_of_16:   ro16.data || [],
        quarterfinals: qf.data  || [],
        semifinals:    sf.data  || [],
        final:         fin.data || [],
      });
      setLoading(false);
    };
    load();
  }, []);

  const phaseMap = useMemo(() => {
    const map = {};
    [1, 2, 3].forEach(r => {
      (roundRankings[r] || []).forEach(u => { map[u.user_id] = `${r}ª Rod.`; });
    });
    const labels = { round_of_16: 'Oitavas', quarterfinals: 'Quartas', semifinals: 'Semifinal', final: 'Final' };
    ['round_of_16', 'quarterfinals', 'semifinals', 'final'].forEach(ph => {
      (phaseRankings[ph] || []).forEach(u => { map[u.user_id] = labels[ph]; });
    });
    return map;
  }, [roundRankings, phaseRankings]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const isGroupRound = GROUP_ROUNDS.includes(tab);
  const isKnockout   = KNOCKOUT_PHASES.includes(tab);
  const isRound      = isGroupRound || isKnockout;

  const currentData = isKnockout   ? (phaseRankings[tab] || [])
                    : isGroupRound ? (roundRankings[Number(tab)] || [])
                    : ranking;

  const myPos = currentData.find(r => r.username === profile?.username);

  return (
    <div className="ranking-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Ranking</h1>
        <span className="badge badge-orange">{currentData.length} participantes</span>
      </div>

      <div className="ranking-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`ranking-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isRound && currentData.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">⏳</span>
          <p>Nenhum resultado disponível ainda para {TAB_LABEL[tab]}.</p>
        </div>
      )}

      {myPos && (
        <div className="my-position">
          <span className="my-pos-num">#{myPos.position}</span>
          <div>
            <div className="my-pos-name">Sua posição {isRound ? `em ${TAB_LABEL[tab]}` : 'atual'}</div>
            <div className="my-pos-pts">
              {Number(isRound ? myPos.round_points : myPos.total_points).toFixed(2)} pontos
            </div>
          </div>
          <div className="my-pos-stats">
            <span>{myPos.exact_scores} exatos</span>
            <span>{myPos.correct_winners} vencedores</span>
            {!isRound && <span>{myPos.correct_extras} extras</span>}
          </div>
        </div>
      )}

      {currentData.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Participante</th>
                  <th>Cidade/UF</th>
                  {isRound ? (
                    <>
                      <th>Pontos</th>
                      {tab === '1' && <th>Quiz</th>}
                      <th>Exatos</th>
                      <th>Acertos</th>
                    </>
                  ) : (
                    <>
                      <th>Fase</th>
                      <th>Placar</th>
                      <th>Extras</th>
                      <th>Total</th>
                      <th>Exatos</th>
                      <th>Acertos</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentData.map((r, i) => (
                  <tr
                    key={isRound ? `${r.user_id}-${tab}` : r.user_id}
                    className={r.username === profile?.username ? 'my-row' : ''}
                  >
                    <td className="rank-pos">
                      {i < 3 ? MEDALS[i] : <span className="rank-num">{r.position}</span>}
                    </td>
                    <td>
                      <div className="rank-user">
                        {r.username === profile?.username && <span className="you-tag">Você</span>}
                        <span className="rank-username">{r.username}</span>
                        {r.instagram && (
                          <a href={`https://instagram.com/${r.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="rank-ig">📷</a>
                        )}
                      </div>
                      {r.full_name && <div className="rank-fullname">{r.full_name}</div>}
                    </td>
                    <td className="rank-city">{r.city && r.state ? `${r.city}/${r.state}` : '-'}</td>
                    {isRound ? (
                      <>
                        <td className="rank-total">{Number(r.round_points||0).toFixed(2)}</td>
                        {tab === '1' && <td className="rank-quiz">+{Number(r.quiz_points||0).toFixed(2)}</td>}
                        <td className="rank-exact">{r.exact_scores||0}</td>
                        <td>{r.correct_winners||0}</td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span className={`phase-badge phase-badge--${
                            !phaseMap[r.user_id] ? 'quiz'
                            : ['1ª Rod.','2ª Rod.','3ª Rod.'].includes(phaseMap[r.user_id]) ? 'grupos'
                            : 'knockout'
                          }`}>
                            {phaseMap[r.user_id] || 'Quiz'}
                          </span>
                        </td>
                        <td>{Number(r.score_points||0).toFixed(0)}</td>
                        <td className="rank-extra">+{Number(r.extra_points||0).toFixed(2)}</td>
                        <td className="rank-total">{Number(r.total_points||0).toFixed(2)}</td>
                        <td className="rank-exact">{r.exact_scores||0}</td>
                        <td>{r.correct_winners||0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="ranking-legend">
        <strong>Critério de desempate:</strong> 1° Placares exatos · 2° Vencedores corretos · 3° Acerto do campeão · 4° Data de cadastro
      </div>
    </div>
  );
}
