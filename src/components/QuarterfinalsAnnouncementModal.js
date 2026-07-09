import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LuckyAnnouncementModal.css';

const SEEN_KEY = 'copa_quarterfinals_announcement_seen_v1_';
const COLORS = ['#FFD23F', '#004AAD', '#FFFFFF', '#FF7A00', '#009C3B'];

const spawnConfetti = (container) => {
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.className = 'la-confetti';
    const x = Math.random() * 100;
    const size = 6 + Math.random() * 12;
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

export default function QuarterfinalsAnnouncementModal() {
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
    intervalRef.current = setInterval(() => spawnConfetti(confettiRef.current), 200);
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
        <span className="la-kicker">MATA-MATA DA COPA 2026</span>
        <h2 className="la-title">Quartas de Final chegaram! ⚽</h2>
        <p className="la-text">
          Só os 8 melhores restam! Palpite nos 4 duelos das Quartas —
          <strong> França × Marrocos</strong>, <strong>Portugal × Bélgica</strong>,
          <strong> Noruega × Inglaterra</strong> e <strong>Argentina × Suíça</strong>.
          Cada palpite certo vale pontos no ranking!
        </p>
        <div className="la-kickoff-box">
          📅 Jogos de 9 a 11 de julho — garanta seus palpites antes de cada jogo!
        </div>
        <Link to="/" className="btn btn-primary btn-full la-cta" onClick={handleClose}>
          ⚽ Ver os jogos e palpitar
        </Link>
      </div>
    </div>
  );
}
