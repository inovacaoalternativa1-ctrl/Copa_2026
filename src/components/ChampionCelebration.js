import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ChampionCelebration.css';

const SEEN_KEY = 'copa_champion_espanha_seen_v1_';

// Cores da Espanha + ouro
const COLORS = ['#AA151B','#F1BF00','#FFFFFF','#FFD700','#FF4444','#FFE066','#C8102E'];

function spawnConfetti(container) {
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('span');
    el.className = 'champ-confetti';
    const x    = Math.random() * 110 - 5;
    const size = 6 + Math.random() * 14;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dur  = 2.2 + Math.random() * 2.5;
    const rot  = -500 + Math.random() * 1000;
    const drift = -80 + Math.random() * 160;
    const isRect = Math.random() > 0.25;
    const isStar = !isRect && Math.random() > 0.5;
    if (isStar) {
      el.textContent = ['★','✦','⭐','✨'][Math.floor(Math.random()*4)];
      el.style.cssText = `left:${x}%;font-size:${size+4}px;color:${color};text-shadow:0 0 8px ${color};animation:champ-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    } else {
      el.style.cssText = `left:${x}%;width:${size}px;height:${isRect?Math.max(3,size*0.4):size}px;background:${color};border-radius:${isRect?'2px':'50%'};box-shadow:0 0 8px ${color}99;animation:champ-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    }
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 120);
  }
}

function spawnFirework(container) {
  if (!container) return;
  const cx = 10 + Math.random() * 80;
  const cy = 5  + Math.random() * 50;
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('span');
    el.className = 'champ-spark';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const ang   = (i / 20) * 360;
    const dist  = 30 + Math.random() * 80;
    const size  = 4 + Math.random() * 6;
    const dur   = 0.6 + Math.random() * 0.5;
    el.style.cssText = `left:${cx}%;top:${cy}%;width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 10px ${color};animation:champ-spark ${dur}s ease-out forwards;--ang:${ang}deg;--dist:${dist}px;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }
}

export default function ChampionCelebration() {
  const { user } = useAuth();
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const containerRef  = useRef(null);
  const confettiTimer = useRef(null);
  const fireworkTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SEEN_KEY + user.id)) return;
    setVisible(true);
  }, [user]);

  useEffect(() => {
    if (!visible || dismissed) return;
    // Confetes contínuos
    confettiTimer.current = setInterval(() => spawnConfetti(containerRef.current), 120);
    // Fogos em posições aleatórias
    fireworkTimer.current = setInterval(() => spawnFirework(containerRef.current), 600);
    return () => {
      clearInterval(confettiTimer.current);
      clearInterval(fireworkTimer.current);
    };
  }, [visible, dismissed]);

  const handleClose = () => {
    if (user) localStorage.setItem(SEEN_KEY + user.id, 'true');
    clearInterval(confettiTimer.current);
    clearInterval(fireworkTimer.current);
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="champ-overlay">
      <div className="champ-particle-layer" ref={containerRef} />
      <div className="champ-modal">
        <button className="champ-close" onClick={handleClose}>✕</button>

        <div className="champ-flag-row">
          <img src="https://flagcdn.com/w80/es.png" alt="Espanha" className="champ-flag" />
        </div>

        <div className="champ-trophy-row">🏆</div>

        <span className="champ-kicker">COPA DO MUNDO 2026 · CAMPEÃ</span>

        <h1 className="champ-title">
          ESPANHA<br />CAMPEÃ DO<br />MUNDO! 🇪🇸
        </h1>

        <p className="champ-text">
          A <strong>Espanha</strong> é a grande campeã da Copa do Mundo 2026!
          Parabéns a todos que acompanharam essa jornada incrível no bolão!
        </p>

        <div className="champ-score-box">
          <img src="https://flagcdn.com/w40/es.png" alt="ESP" className="champ-score-flag" />
          <span className="champ-score-text">Espanha × Argentina</span>
          <img src="https://flagcdn.com/w40/ar.png" alt="ARG" className="champ-score-flag" />
        </div>

        <div className="champ-stars">★ ★ ★ ★ ★</div>

        <button className="champ-btn" onClick={handleClose}>
          🎉 Celebrar! 🎉
        </button>
      </div>
    </div>
  );
}
