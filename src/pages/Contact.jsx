import { useEffect } from 'react';
import { setPageSEO } from '../lib/seo.js';

export default function Contact({ goHome, goShop }) {
  useEffect(() => {
    setPageSEO('Nous joindre', 'Contactez Le Mercier Alma — 630 Rue Sacré-Coeur O, Alma, Québec. Téléphone, courriel, heures d\'ouverture et réseaux sociaux.', '/nous-joindre');
  }, []);

  return (
    <main className="wrap page contact-page">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Nous joindre</span>
      </div>
      <h1 className="page-title">Nous joindre</h1>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="contact-card">
            <h2 className="contact-card-title">Adresse</h2>
            <div className="contact-card-body">630 Rue Sacré-Coeur O, Alma, Québec G8B 1M1</div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Téléphone</h2>
            <div className="contact-card-body"><a href="tel:+14186623240">(418) 662-3240</a></div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Heures d'ouverture</h2>
            <div className="contact-card-hours">
              <div><span className="contact-hours-day">Lun–Mer</span> 9h30–17h30</div>
              <div><span className="contact-hours-day">Jeu–Ven</span> 9h30–21h</div>
              <div><span className="contact-hours-day">Sam</span> 9h30–17h</div>
              <div><span className="contact-hours-day">Dim</span> 12h–16h</div>
            </div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Réseaux sociaux</h2>
            <div className="contact-socials">
              <a href="https://www.facebook.com/lemercieralma/?locale=fr_CA" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://www.instagram.com/lemercieralma/" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Livraison</h2>
            <div className="contact-card-body">Livraison 25 $ · offerte dès 200 $ partout au Québec. Retour facile sous 30 jours.</div>
          </div>
        </div>

        <div className="contact-map">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-71.66%2C48.54%2C-71.64%2C48.56&layer=mapnik&marker=48.5502,-71.6536"
            title="Carte Le Mercier Alma"
            loading="lazy"
            style={{ width: '100%', height: '100%', border: 0, borderRadius: 12, minHeight: 360 }}
          />
        </div>
      </div>

      <button className="btn-primary" onClick={() => goShop()} style={{ marginTop: 32 }}>MAGASINER</button>
    </main>
  );
}
