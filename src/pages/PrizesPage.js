import React, { useState, useRef } from 'react';
import './PrizesPage.css';

const PRIZES = [
  {
    position: 1, medal: '🥇', label: '1º Lugar', color: 'gold',
    items: [
      { icon: '🏖️', text: 'Fim de semana em Porto de Galinhas', img: '/images/prizes/porto.jpg' },
      { icon: '💸', text: 'Pix R$ 200,00', img: '/images/prizes/dinheiro.jpg' },
    ],
  },
  {
    position: 2, medal: '🥈', label: '2º Lugar', color: 'silver',
    items: [
      { icon: '🔊', text: 'Alexa (Echo Dot)', img: '/images/prizes/alexa.jpg' },
      { icon: '🍷', text: 'Vinho Pérgola', img: '/images/prizes/vinho.png' },
    ],
  },
  {
    position: 3, medal: '🥉', label: '3º Lugar', color: 'bronze',
    items: [
      { icon: '⚽', text: 'Bola Techmetria', img: '/images/prizes/bola.jpeg' },
      { icon: '🍷', text: 'Vinho Pérgola', img: '/images/prizes/vinho.png' },
    ],
  },
];

const LUCKY_PRIZES = [
  {
    position: 1, medal: '🥇', label: '1º Lugar', color: 'gold',
    items: [
      { icon: '👕', text: 'Camisa do Brasil Techmetria + Vinho', img: '/images/lucky-prizes/primeiro-lugar.jpg' },
    ],
  },
  {
    position: 2, medal: '🥈', label: '2º Lugar', color: 'silver',
    items: [
      { icon: '👕', text: 'Camisa Copa Alternativa 2026 + Vinho + Copo', img: '/images/lucky-prizes/segundo-lugar.jpg' },
    ],
  },
  {
    position: 3, medal: '🥉', label: '3º Lugar', color: 'bronze',
    items: [
      { icon: '🧢', text: 'Boné + Copo Copa Alternativa 2026', img: '/images/lucky-prizes/terceiro-lugar.jpg' },
    ],
  },
];

const BR = ['#009C3B','#FFDF00','#002776','#FFFFFF','#FFDF00','#009C3B','#FFDF00','#009C3B'];

function spawnBurst(card) {
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('span');
    el.className = 'pz-spark';
    const x = 5 + Math.random() * 90;
    const y = 5 + Math.random() * 90;
    const size = 4 + Math.random() * 13;
    const color = BR[Math.floor(Math.random() * BR.length)];
    const ang = (i / 30) * 360 + Math.random() * 15;
    const dist = 40 + Math.random() * 110;
    const dur = 0.4 + Math.random() * 0.6;
    const delay = Math.random() * 0.22;
    const isStar = Math.random() > 0.72;
    const isRect = !isStar && Math.random() > 0.42;
    if (isStar) {
      el.textContent = Math.random() > 0.5 ? '★' : '✦';
      el.style.cssText = `left:${x}%;top:${y}%;font-size:${size + 6}px;color:${color};text-shadow:0 0 10px ${color};line-height:1;animation:pz-spark-fly ${dur}s ${delay}s ease-out forwards;--ang:${ang}deg;--dist:${dist}px;`;
    } else {
      el.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${isRect ? Math.max(3, size * 0.38) : size}px;background:${color};border-radius:${isRect ? '2px' : '50%'};box-shadow:0 0 8px ${color}cc;animation:pz-spark-fly ${dur}s ${delay}s ease-out forwards;--ang:${ang}deg;--dist:${dist}px;`;
    }
    card.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay) * 1000 + 80);
  }
}

function spawnConfetti(card) {
  const colors = ['#009C3B','#FFDF00','#002776','#FFFFFF'];
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('span');
    el.className = 'pz-confetti';
    const x = Math.random() * 104;
    const size = 5 + Math.random() * 11;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const dur = 1.0 + Math.random() * 1.0;
    const rot = -320 + Math.random() * 640;
    const drift = -45 + Math.random() * 90;
    const isRect = Math.random() > 0.28;
    el.style.cssText = `left:${x}%;width:${size}px;height:${isRect ? Math.max(3, size * 0.42) : size}px;background:${color};border-radius:${isRect ? '3px' : '50%'};box-shadow:0 0 5px ${color}66;animation:pz-fall ${dur}s ease-in forwards;--rot:${rot}deg;--drift:${drift}px;`;
    card.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 80);
  }
}

export default function PrizesPage() {
  const [lightbox, setLightbox] = useState(null);
  const timerRef = useRef(null);

  const onEnter = (e) => {
    const card = e.currentTarget;
    spawnBurst(card);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => spawnConfetti(card), 195);
  };

  const onLeave = () => clearInterval(timerRef.current);

  return (
    <div className="prizes-page">
      <div className="prizes-hero">
        <div className="prizes-trophy">🏆</div>
        <h1 className="prizes-title">Prêmios</h1>
        <p className="prizes-subtitle">Os melhores palpiteiros da Copa 2026 levam para casa</p>
      </div>

      <div className="prizes-list">
        {PRIZES.map(prize => (
          <div
            key={prize.position}
            className={`prize-card prize-card--${prize.color}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <div className="prize-card__header">
              <span className="prize-card__medal">{prize.medal}</span>
              <span className="prize-card__label">{prize.label}</span>
            </div>
            <ul className="prize-card__items">
              {prize.items.map((item, i) => (
                <li key={i} className="prize-card__item">
                  <div
                    className="prize-card__item-img-wrap"
                    onClick={() => item.img && setLightbox({ src: item.img, alt: item.text })}
                    title="Clique para ampliar"
                  >
                    {item.img
                      ? <img src={item.img} alt={item.text} className="prize-card__item-img"
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null}
                    <span className="prize-card__item-icon" style={{ display: item.img ? 'none' : 'flex' }}>{item.icon}</span>
                  </div>
                  <span className="prize-card__item-text">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="prizes-footer">
        Vencedores definidos ao final da Copa do Mundo 2026 pelo ranking geral.
      </p>

      <div className="prizes-hero prizes-hero--lucky">
        <div className="prizes-trophy">🍀</div>
        <h1 className="prizes-title">Prêmios — Palpite da Sorte</h1>
        <p className="prizes-subtitle">Ranking separado, exclusivo do palpite Brasil × Escócia</p>
      </div>

      <div className="prizes-list">
        {LUCKY_PRIZES.map(prize => (
          <div
            key={prize.position}
            className={`prize-card prize-card--${prize.color} prize-card--lucky`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <div className="prize-card__header">
              <span className="prize-card__medal">{prize.medal}</span>
              <span className="prize-card__label">{prize.label}</span>
              <span className="prize-card__lucky-tag">🍀 Palpite da Sorte</span>
            </div>
            <ul className="prize-card__items">
              {prize.items.map((item, i) => (
                <li key={i} className="prize-card__item">
                  <div
                    className="prize-card__item-img-wrap"
                    onClick={() => item.img && setLightbox({ src: item.img, alt: item.text })}
                    title="Clique para ampliar"
                  >
                    {item.img
                      ? <img src={item.img} alt={item.text} className="prize-card__item-img"
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null}
                    <span className="prize-card__item-icon" style={{ display: item.img ? 'none' : 'flex' }}>{item.icon}</span>
                  </div>
                  <span className="prize-card__item-text">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="prizes-footer">
        Vencedores definidos pelo resultado real do jogo Brasil × Escócia — ranking independente da Copa.
      </p>

      {lightbox && (
        <div className="prizes-lightbox" onClick={() => setLightbox(null)}>
          <div className="prizes-lightbox__inner" onClick={e => e.stopPropagation()}>
            <button className="prizes-lightbox__close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox.src} alt={lightbox.alt} className="prizes-lightbox__img" />
            <p className="prizes-lightbox__caption">{lightbox.alt}</p>
          </div>
        </div>
      )}
    </div>
  );
}
