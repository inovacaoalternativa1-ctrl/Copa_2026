import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LuckyAnnouncementModal.css';

const SEEN_KEY = 'copa_final_announcement_seen_v1_';
const COLORS = ['#FFD23F', '#AA151B', '#F1BF00', '#75AADB', '#FFFFFF'];

const spawnConfetti = (container) => {
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('span');
    el.className = 'la-confetti';
    const x = Math.random() * 100;
    const size = 7 + Math.random() * 13;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dur = 2.6 + Math.random() * 2.2;
    const rot = -380 + Math.random() * 760;
    const drift = -70 + Math.random() * 140;
    const isRect = Math.random() > 0.3;
    el.style.cssText = `left:${x}%;width:${size}px;height:${isRect ? Math.max(3, size * 0.4) : size}px;background:${color};border-radius:${isRect ? '2px' : '50%'};box-shadow:0 0 6px ${color}99;animation:la-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }
};

export default function FinalAnnouncementModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const confettiRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SEEN_KEY + user.id)) return;
    setVisible(true);
  }, [user]);

  useEffect(() => {
    if (!visible) return;
    spawnConfetti(confettiRef.current);
    intervalRef.current = setInterval(() => spawnConfetti(confettiRef.current), 180);
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  const handleClose = () => {
    if (user) localStorage.setItem(SEEN_KEY + user.id, 'true');
    clearInterval(intervalRef.current);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="la-overlay">
      <div className="la-confetti-layer" ref={confettiRef} />
      <div className="la-modal">
        <button className="la-close" onClick={handleClose}>✕</button>
        <div className="la-trophy">🏆</div>
        <span className="la-kicker">COPA DO MUNDO 2026</span>
        <h2 className="la-title">
          É FINAL!{' '}
          <img src="https://flagcdn.com/w40/es.png" alt="Espanha" style={{height:'1em',verticalAlign:'middle',borderRadius:2}} />
          {' × '}
          <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" style={{height:'1em',verticalAlign:'middle',borderRadius:2}} />
        </h2>
        <p className="la-text">
          A grande decisão chegou! <strong>Espanha × Argentina</strong> se enfrentam
          na final da Copa do Mundo 2026. Faça seu palpite e concorra ao prêmio!
        </p>
        <div className="la-kickoff-box">
          📅 Domingo, 19 de julho às 16h (Brasília) · MetLife Stadium
        </div>
        <Link to="/" className="btn btn-primary btn-full la-cta" onClick={handleClose}>
          ⚽ Palpitar na Final agora
        </Link>
      </div>
    </div>
  );
}
