import React, { useState, useEffect } from 'react';
import { getRanking } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './RankingPage.css';

const MEDALS = ['🥇','🥈','🥉'];

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => { getRanking().then(({data}) => setRanking(data||[])).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const myPos = ranking.find(r => r.username === profile?.username);

  return (
    <div className="ranking-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Ranking</h1>
        <span className="badge badge-orange">{ranking.length} participantes</span>
      </div>

      {myPos && (
        <div className="my-position">
          <span className="my-pos-num">#{myPos.position}</span>
          <div>
            <div className="my-pos-name">Sua posição atual</div>
            <div className="my-pos-pts">{Number(myPos.total_points).toFixed(2)} pontos</div>
          </div>
          <div className="my-pos-stats">
            <span>{myPos.exact_scores} exatos</span>
            <span>{myPos.correct_winners} vencedores</span>
            <span>{myPos.correct_extras} extras</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th>Cidade/UF</th>
                <th>Placar</th>
                <th>Extras</th>
                <th>Total</th>
                <th>Exatos</th>
                <th>Acertos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.id} className={r.username === profile?.username ? 'my-row' : ''}>
                  <td className="rank-pos">
                    {i < 3 ? MEDALS[i] : <span className="rank-num">{r.position}</span>}
                  </td>
                  <td>
                    <div className="rank-user">
                      {r.username === profile?.username && <span className="you-tag">Você</span>}
                      <span className="rank-username">{r.username}</span>
                      {r.instagram && <a href={`https://instagram.com/${r.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="rank-ig">📷</a>}
                    </div>
                    {r.full_name && <div className="rank-fullname">{r.full_name}</div>}
                  </td>
                  <td className="rank-city">{r.city && r.state ? `${r.city}/${r.state}` : '-'}</td>
                  <td>{Number(r.score_points||0).toFixed(0)}</td>
                  <td className="rank-extra">+{Number(r.extra_points||0).toFixed(2)}</td>
                  <td className="rank-total">{Number(r.total_points||0).toFixed(2)}</td>
                  <td className="rank-exact">{r.exact_scores||0}</td>
                  <td>{r.correct_winners||0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ranking-legend">
        <strong>Critério de desempate:</strong> 1° Placares exatos · 2° Vencedores corretos · 3° Acerto do campeão · 4° Data de cadastro
      </div>
    </div>
  );
}
