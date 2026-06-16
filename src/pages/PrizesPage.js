import React, { useState } from 'react';
import './PrizesPage.css';

const PRIZES = [
  {
    position: 1,
    medal: '🥇',
    label: '1º Lugar',
    color: 'gold',
    items: [
      { icon: '🏖️', text: 'Fim de semana em Porto de Galinhas', img: '/images/prizes/porto.jpg' },
      { icon: '💸', text: 'Pix R$ 200,00', img: '/images/prizes/dinheiro.jpg' },
    ],
  },
  {
    position: 2,
    medal: '🥈',
    label: '2º Lugar',
    color: 'silver',
    items: [
      { icon: '🔊', text: 'Alexa (Echo Dot)', img: '/images/prizes/alexa.jpg' },
      { icon: '🍷', text: 'Vinho Pérgola', img: '/images/prizes/vinho.png' },
    ],
  },
  {
    position: 3,
    medal: '🥉',
    label: '3º Lugar',
    color: 'bronze',
    items: [
      { icon: '⚽', text: 'Bola Techmetria', img: '/images/prizes/bola.jpeg' },
      { icon: '🍷', text: 'Vinho Pérgola', img: '/images/prizes/vinho.png' },
    ],
  },
];

export default function PrizesPage() {
  const [lightbox, setLightbox] = useState(null);

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
                  <div
                    className="prize-card__item-img-wrap"
                    onClick={() => item.img && setLightbox({ src: item.img, alt: item.text })}
                    title="Clique para ampliar"
                  >
                    {item.img
                      ? <img
                          src={item.img}
                          alt={item.text}
                          className="prize-card__item-img"
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      : null}
                    <span
                      className="prize-card__item-icon"
                      style={{ display: item.img ? 'none' : 'flex' }}
                    >{item.icon}</span>
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
