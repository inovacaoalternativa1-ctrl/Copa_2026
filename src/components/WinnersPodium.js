import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';
import './WinnersPodium.css';

const PRIZES = {
  1: '🏖️ Porto de Galinhas + 💸 Pix R$200',
  2: '🔊 Alexa Echo Dot + 🍷 Vinho',
  3: '⚽ Bola Techmetria + 🍷 Vinho',
};

const PODIUM_ORDER = [2, 1, 3];

const getInitials = name => {
  const p = (name || '').trim().split(/\s+/);
  return p.length === 1 ? (name || '').slice(0, 2).toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export default function WinnersPodium() {
  const [top3, setTop3] = useState([]);

  useEffect(() => {
    supabase.from('ranking').select('username, total_points, avatar_url, position')
      .lte('position', 3).order('position')
      .then(({ data }) => setTop3(data || []));
  }, []);

  if (top3.length === 0) return null;

  const byPos = {};
  top3.forEach(u => { byPos[u.position] = u; });

  const slots = {
    1: { label: '1º', medal: '🥇', color: 'gold',   height: 110 },
    2: { label: '2º', medal: '🥈', color: 'silver', height: 80  },
    3: { label: '3º', medal: '🥉', color: 'bronze', height: 55  },
  };

  return (
    <div className="wp-wrap">
      <div className="wp-header">
        <span className="wp-trophy">🏆</span>
        <div>
          <div className="wp-title">Ganhadores da Copa Alternativa 2026</div>
          <div className="wp-sub">Parabéns aos melhores palpiteiros! 🎉</div>
        </div>
        <span className="wp-trophy">🏆</span>
      </div>

      <div className="wp-stage">
        {PODIUM_ORDER.map(pos => {
          const user = byPos[pos];
          const slot = slots[pos];
          if (!user || !slot) return null;
          return (
            <div key={pos} className={`wp-slot wp-slot--${slot.color}`}>
              <div className="wp-avatar-wrap">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} className="wp-avatar" />
                  : <div className="wp-avatar wp-avatar--initials">{getInitials(user.username)}</div>}
                <span className="wp-badge">{slot.medal}</span>
              </div>
              <div className="wp-name">{user.username}</div>
              <div className="wp-pts">{Number(user.total_points || 0).toFixed(2)} pts</div>
              <div className="wp-block" style={{ height: slot.height }}>
                <span className="wp-pos">{slot.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wp-prizes">
        {[1, 2, 3].map(pos => {
          const user = byPos[pos];
          const slot = slots[pos];
          if (!user) return null;
          return (
            <div key={pos} className={`wp-prize wp-prize--${slot.color}`}>
              <span className="wp-prize-medal">{slot.medal}</span>
              <div>
                <strong>{user.username}</strong>
                <span className="wp-prize-text"> — {PRIZES[pos]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
