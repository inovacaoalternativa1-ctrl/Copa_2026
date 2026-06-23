import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLuckyKickoff } from '../services/luckyAutoDetect';
import './LuckyAnnouncementModal.css';

const SEEN_KEY_PREFIX = 'copa_lucky_announcement_seen_';
const BR_COLORS = ['#009C3B', '#FFDF00', '#002776', '#FFFFFF'];

const spawnConfetti = (container) => {
  if (!container) return;
  for (let i = 0; i < 16; i++) {
    const el = document.createElement('span');
    el.className = 'la-confetti';
    const x = Math.random() * 100;
    const size = 6 + Math.random() * 12;
    const color = BR_COLORS[Math.floor(Math.random() * BR_COLORS.length)];
    const dur = 2.6 + Math.random() * 2.2;
    const rot = -380 + Math.random() * 760;
    const drift = -70 + Math.random() * 140;
    const isRect = Math.random() > 0.3;
    el.style.cssText = `left:${x}%;width:${size}px;height:${isRect ? Math.max(3, size * 0.4) : size}px;background:${color};border-radius:${isRect ? '2px' : '50%'};box-shadow:0 0 6px ${color}99;animation:la-fall ${dur}s linear forwards;--rot:${rot}deg;--drift:${drift}px;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }
};

const formatKickoff = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  return `${date}, às ${time} (horário de Brasília)`;
};

export default function LuckyAnnouncementModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [kickoffText, setKickoffText] = useState(null);
  const confettiRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SEEN_KEY_PREFIX + user.id)) return;
    setVisible(true);
    getLuckyKickoff().then(iso => setKickoffText(formatKickoff(iso)));
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
        <h2 className="la-title">Chegou o Palpite da Sorte! 🍀</h2>
        <p className="la-teams">
          <img src="https://flagcdn.com/w40/br.png" alt="Brasil" className="la-flag" /> Brasil
          <span className="la-versus">×</span>
          Escócia <img src="https://flagcdn.com/w40/gb-sct.png" alt="Escócia" className="la-flag" />
        </p>
        <p className="la-text">
          Um palpite único e separado do ranking geral: placar exato, quem marca primeiro
          e qual jogador marca primeiro — com prêmios próprios pros 3 primeiros colocados!
        </p>
        <div className="la-kickoff-box">
          📅 {kickoffText || 'Data e horário do jogo serão confirmados em breve.'}
        </div>
        <Link to="/palpite-sorte" className="btn btn-primary btn-full la-cta" onClick={handleClose}>
          🍀 Fazer meu palpite agora
        </Link>
      </div>
    </div>
  );
}
