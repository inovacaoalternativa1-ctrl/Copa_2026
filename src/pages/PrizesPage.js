import React from 'react';
import './PrizesPage.css';

const PRIZES = [
  {
    position: 1,
    medal: '🥇',
    label: '1º Lugar',
    color: 'gold',
    items: [
      {
        icon: '🏖️',
        text: 'Fim de semana em Porto de Galinhas',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Porto_de_Galinhas%2C_Ipojuca%2C_Pernambuco%2C_Brasil_%2837390694296%29.jpg/640px-Porto_de_Galinhas%2C_Ipojuca%2C_Pernambuco%2C_Brasil_%2837390694296%29.jpg',
      },
      {
        icon: '💸',
        text: 'Pix R$ 200,00',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Pix_logo.svg/320px-Pix_logo.svg.png',
      },
    ],
  },
  {
    position: 2,
    medal: '🥈',
    label: '2º Lugar',
    color: 'silver',
    items: [
      {
        icon: '🔊',
        text: 'Alexa (Echo Dot)',
        img: 'https://m.media-amazon.com/images/I/61dX5SjUnnL._AC_SL400_.jpg',
      },
      {
        icon: '🍷',
        text: 'Vinho',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-nature-natural-beauty.jpg/320px-24701-nature-natural-beauty.jpg',
      },
    ],
  },
  {
    position: 3,
    medal: '🥉',
    label: '3º Lugar',
    color: 'bronze',
    items: [
      {
        icon: '⚽',
        text: 'Bola Techmetria',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Soccerball.svg/320px-Soccerball.svg.png',
      },
      {
        icon: '🍷',
        text: 'Vinho',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-nature-natural-beauty.jpg/320px-24701-nature-natural-beauty.jpg',
      },
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
                  <div className="prize-card__item-img-wrap">
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
    </div>
  );
}
