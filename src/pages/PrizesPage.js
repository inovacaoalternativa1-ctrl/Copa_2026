import React from 'react';
import './PrizesPage.css';

const PRIZES = [
  {
    position: 1,
    medal: '🥇',
    label: '1º Lugar',
    color: 'gold',
    items: [
      { icon: '🏖️', text: 'Fim de semana em Porto de Galinhas' },
      { icon: '💸', text: 'Pix R$ 200,00' },
    ],
  },
  {
    position: 2,
    medal: '🥈',
    label: '2º Lugar',
    color: 'silver',
    items: [
      { icon: '🔊', text: 'Alexa (Echo Dot)' },
      { icon: '🍷', text: 'Vinho' },
    ],
  },
  {
    position: 3,
    medal: '🥉',
    label: '3º Lugar',
    color: 'bronze',
    items: [
      { icon: '⚽', text: 'Bola Techmetria' },
      { icon: '🍷', text: 'Vinho' },
    ],
  },
];

export default function PrizesPage() {
  return (
    <div className="prizes-page">
      <div className="prizes-hero">
        <div className="prizes-trophy">🏆</div>
        <h1 className="prizes-title">Prêmios</h1>
        <p className="prizes-subtitle">Os melhores palpiteiros da Copa 2026 levam para casa</p>
      </div>

      <div className="prizes-list">
        {PRIZES.map(prize => (
          <div key={prize.position} className={`prize-card prize-card--${prize.color}`}>
            <div className="prize-card__header">
              <span className="prize-card__medal">{prize.medal}</span>
              <span className="prize-card__label">{prize.label}</span>
            </div>
            <ul className="prize-card__items">
              {prize.items.map((item, i) => (
                <li key={i} className="prize-card__item">
                  <span className="prize-card__item-icon">{item.icon}</span>
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
    </div>
  );
}
