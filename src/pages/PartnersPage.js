import React, { useEffect, useState } from 'react';
import { getSponsors } from '../services/api';
import './PartnersPage.css';

const toAbsoluteUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function PartnersPage() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSponsors().then(({ data }) => {
      setSponsors(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="partners-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="partners-page">
      <div className="partners-hero">
        <h1 className="partners-title">Nossos Parceiros</h1>
        <p className="partners-subtitle">Empresas que acreditam e apoiam o Copa Simulada</p>
      </div>

      {sponsors.length === 0 ? (
        <div className="partners-empty">
          <span className="partners-empty-icon">🤝</span>
          <p>Nenhum parceiro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="partners-grid">
          {sponsors.map(s => (
            <div key={s.id} className="partner-card">
              {s.website_url ? (
                <a href={toAbsoluteUrl(s.website_url)} target="_blank" rel="noopener noreferrer" className="partner-card-link">
                  <div className="partner-logo-wrap">
                    <img src={s.logo_url} alt={s.name} className="partner-logo" />
                  </div>
                  <span className="partner-name">{s.name}</span>
                  <span className="partner-visit">Visitar →</span>
                </a>
              ) : (
                <div className="partner-card-inner">
                  <div className="partner-logo-wrap">
                    <img src={s.logo_url} alt={s.name} className="partner-logo" />
                  </div>
                  <span className="partner-name">{s.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
