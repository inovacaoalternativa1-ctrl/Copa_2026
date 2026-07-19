import React, { useEffect, useRef, useState } from 'react';
import supabase from '../services/supabase';
import './PodiumCelebration.css';

const SEEN_KEY = 'copa_podium_2026_seen_v1_';
const COLORS   = ['#FFD700','#AA151B','#F1BF00','#C0C0C0','#FFFFFF','#FF4444'];

function spawnConfetti(container) {
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const el    = document.createElement('span');
    el.className = 'pod-confetti';
    const x     = Math.random() * 110 - 5;
    const size  = 6 + Math.random() * 14;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dur   = 2.4 + Math.random() * 2.4;
    const rot   = -600 + Math.random() * 1200;
    const drift = -90 + Math.random() * 180;
    const isStar = Math.random() > 0.7;
    const isRect = !isStar && Math.random() > 0.35;
    if (isStar) {
      el.textContent = ['★','✦','🏆','⭐'][Math.floor(Math.random() * 4)];
      el.style.cssText = `left:${x}%;font-size:${size + 4}px;color:${color};text-shadow:0 0 8px ${color};animation:pod-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    } else {
      el.style.cssText = `left:${x}%;width:${size}px;height:${isRect ? Math.max(3, size * 0.4) : size}px;background:${color};border-radius:${isRect ? '3px' : '50%'};box-shadow:0 0 8px ${color}88;animation:pod-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    }
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 150);
  }
}

const MEDALS = [
  { pos: 1, icon: '🥇', label: '1º Lugar', color: 'gold',   height: 140 },
  { pos: 2, icon: '🥈', label: '2º Lugar', color: 'silver', height: 100 },
  { pos: 3, icon: '🥉', label: '3º Lugar', color: 'bronze', height: 70  },
];

const PODIUM_ORDER = [2, 1, 3]; // visual: prata, ouro, bronze

export default function PodiumCelebration() {
  const [visible,  setVisible]  = useState(false);
  const [top3,     setTop3]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const containerRef = useRef(null);
  const timerRef     = useRef(null);
  const userId       = useRef(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id;
      userId.current = uid;
      if (!uid) return;
      if (localStorage.getItem(SEEN_KEY + uid)) return;

      supabase.from('ranking').select('username, total_points, avatar_url').order('position').limit(3)
        .then(({ data }) => {
          setTop3(data || []);
          setLoading(false);
          setVisible(true);
        });
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!visible) return;
    spawnConfetti(containerRef.current);
    timerRef.current = setInterval(() => spawnConfetti(containerRef.current), 150);
    return () => clearInterval(timerRef.current);
  }, [visible]);

  const handleClose = () => {
    if (userId.current) localStorage.setItem(SEEN_KEY + userId.current, 'true');
    clearInterval(timerRef.current);
    setVisible(false);
  };

  if (!visible) return null;

  const byPos = {};
  top3.forEach((u, i) => { byPos[i + 1] = u; });

  const getInitials = name => {
    const p = (name || '').trim().split(/\s+/);
    return p.length === 1 ? name.slice(0, 2).toUpperCase()
      : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  return (
    <div className="pod-overlay">
      <div className="pod-particles" ref={containerRef} />
      <div className="pod-modal">
        <button className="pod-close" onClick={handleClose}>✕</button>

        <div className="pod-header">
          <div className="pod-trophy">🏆</div>
          <span className="pod-kicker">COPA ALTERNATIVA 2026</span>
          <h2 className="pod-title">Ganhadores do Bolão!</h2>
          <p className="pod-subtitle">Parabéns aos melhores palpiteiros da Copa 2026 🎉</p>
        </div>

        {loading ? (
          <div className="pod-loading">Carregando...</div>
        ) : (
          <>
            <div className="pod-stage">
              {PODIUM_ORDER.map(pos => {
                const medal = MEDALS.find(m => m.pos === pos);
                const user  = byPos[pos];
                if (!user) return null;
                return (
                  <div key={pos} className={`pod-slot pod-slot--${medal.color}`}>
                    <div className="pod-avatar-wrap">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt={user.username} className="pod-avatar-img" />
                        : <div className="pod-avatar-initials">{getInitials(user.username)}</div>}
                      <span className="pod-medal-icon">{medal.icon}</span>
                    </div>
                    <div className="pod-name">{user.username}</div>
                    <div className="pod-pts">{Number(user.total_points || 0).toFixed(2)} pts</div>
                    <div className="pod-block" style={{ height: medal.height }}>
                      <span className="pod-pos-label">{medal.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pod-prizes">
              <div className="pod-prize-row pod-prize--gold">
                <span>🥇</span>
                <span><strong>{byPos[1]?.username}</strong> — 🏖️ Porto de Galinhas + 💸 Pix R$200</span>
              </div>
              <div className="pod-prize-row pod-prize--silver">
                <span>🥈</span>
                <span><strong>{byPos[2]?.username}</strong> — 🔊 Alexa Echo Dot + 🍷 Vinho</span>
              </div>
              <div className="pod-prize-row pod-prize--bronze">
                <span>🥉</span>
                <span><strong>{byPos[3]?.username}</strong> — ⚽ Bola Techmetria + 🍷 Vinho</span>
              </div>
            </div>
          </>
        )}

        <button className="pod-btn" onClick={handleClose}>🎊 Incrível! Parabéns a todos!</button>
      </div>
    </div>
  );
}
