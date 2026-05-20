import React, { useState, useEffect } from 'react';
import { getSponsors } from '../services/api';
import './SocialGateModal.css';

const ALTERNATIVA_IG = 'https://www.instagram.com/alternativaservicospe';

export default function SocialGateModal({ userId, onConfirmed }) {
  const [sponsors, setSponsors] = useState([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getSponsors().then(({ data }) => setSponsors((data || []).slice(0, 3)));
  }, []);

  const toAbsolute = (url) => {
    if (!url) return '#';
    return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
  };

  const handleConfirm = () => {
    localStorage.setItem(`copa2026_social_ok_${userId}`, '1');
    onConfirmed();
  };

  return (
    <div className="sg-overlay">
      <div className="sg-modal">
        <div className="sg-header">
          <span className="sg-icon">📱</span>
          <h2>Antes de fazer seu palpite</h2>
          <p>Para participar do Bolão, siga nossos perfis no Instagram:</p>
        </div>

        <div className="sg-accounts">
          <a href={ALTERNATIVA_IG} target="_blank" rel="noopener noreferrer" className="sg-account sg-account--main">
            <div className="sg-account-avatar">A</div>
            <div className="sg-account-info">
              <span className="sg-account-name">Alternativa Serviços</span>
              <span className="sg-account-handle">@alternativaservicospe</span>
            </div>
            <span className="sg-follow-tag">Seguir ↗</span>
          </a>

          {sponsors.map(s => (
            <a
              key={s.id}
              href={toAbsolute(s.website_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="sg-account"
            >
              {s.logo_url
                ? <img src={s.logo_url} alt={s.name} className="sg-account-logo" />
                : <div className="sg-account-avatar sg-account-avatar--partner">🤝</div>
              }
              <div className="sg-account-info">
                <span className="sg-account-name">{s.name}</span>
                {s.website_url && (
                  <span className="sg-account-handle">
                    {toAbsolute(s.website_url).replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </span>
                )}
              </div>
              <span className="sg-follow-tag">Seguir ↗</span>
            </a>
          ))}
        </div>

        <label className="sg-check-row">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
          <span>Já segui todos os perfis acima!</span>
        </label>

        <button className="sg-confirm-btn" disabled={!checked} onClick={handleConfirm}>
          Continuar e fazer palpite →
        </button>

        <p className="sg-disclaimer">Este aviso não aparecerá novamente após confirmação.</p>
      </div>
    </div>
  );
}
