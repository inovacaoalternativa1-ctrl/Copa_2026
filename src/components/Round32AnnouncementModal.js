import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LuckyAnnouncementModal.css';

const SEEN_KEY_PREFIX = 'copa_round32_announcement_seen_v1_';
const LUCKY_SEEN_KEY_PREFIX = 'copa_lucky_announcement_seen_v3_';
const COLORS = ['#FFD23F', '#004AAD', '#FFFFFF', '#FF7A00'];

const spawnConfetti = (container) => {
  if (!container) return;
  for (let i = 0; i < 16; i++) {
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

export default function Round32AnnouncementModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const confettiRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SEEN_KEY_PREFIX + user.id)) return;

    // Evita empilhar com o aviso do Palpite da Sorte — espera ele fechar primeiro
    // (só relevante pra quem nunca abriu o app antes de nenhum dos dois avisos).
    const lockedByLucky = () => !localStorage.getItem(LUCKY_SEEN_KEY_PREFIX + user.id);
    if (!lockedByLucky()) { setVisible(true); return; }

    const interval = setInterval(() => {
      if (!lockedByLucky()) { setVisible(true); clearInterval(interval); }
    }, 400);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!visible) return;
    spawnConfetti(confettiRef.current);
    intervalRef.current = setInterval(() => spawnConfetti(confettiRef.current), 200);
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  const handleClose = () => {
    if (user) localStorage.setItem(SEEN_KEY_PREFIX + user.id, 'true');
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
        <span className="la-kicker">NOVIDADE NA COPA SIMULADA</span>
        <h2 className="la-title">Chegou a fase de 16 Avos de Final! ⚽</h2>
        <p className="la-text">
          A fase de grupos chegou ao fim e os 16 confrontos do mata-mata já estão
          confirmados — Brasil × Japão, Alemanha × Paraguai, Holanda × Marrocos e mais!
          Já dá pra palpitar igual nos jogos da fase de grupos.
        </p>
        <div className="la-kickoff-box">
          📅 Jogos a partir de 28/06 — confira datas e horários na aba "16 Avos".
        </div>
        <Link to="/" className="btn btn-primary btn-full la-cta" onClick={handleClose}>
          ⚽ Ver os jogos e palpitar
        </Link>
      </div>
    </div>
  );
}
