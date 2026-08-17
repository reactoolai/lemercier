import { useEffect } from 'react';
import { setPageSEO } from '../lib/seo.js';

export default function About({ goShop }) {
  useEffect(() => {
    setPageSEO('À propos', 'Le Mercier Alma — boutique de vêtements pour homme à Alma, Québec. Née à Saint-Georges de Beauce, la boutique offre marques sélectionnées, service personnalisé et ajustements sur mesure.');
  }, []);

  return (
    <main className="wrap page about">
      <h1 className="page-title">À propos de Le Mercier</h1>
      <p>Une mercerie élégante offrant un mélange unique de vêtements pour homme alliant le chic et le décontracté. Après plus de 30 ans au cœur de Saint-Georges de Beauce, Le Mercier s'installe à Alma pour servir les hommes du Lac-Saint-Jean avec la même passion : des marques soigneusement choisies, un service attentionné et des ajustements sur mesure directement en boutique.</p>
      <p>Vous nous trouverez en ligne et bientôt en boutique — surveillez notre infolettre pour l'annonce de l'ouverture officielle.</p>

      <div className="about-contact-card">
        <h2>Nous joindre</h2>
        <div className="about-contact-row">630 Rue Sacré-Coeur O, Alma (Québec)</div>
        <div className="about-contact-row"><a href="tel:+14186623240">(418) 662-3240</a></div>
        <div className="about-contact-hours">
          <div><span className="about-hours-day">Lun–Mer</span> 9h30–17h30</div>
          <div><span className="about-hours-day">Jeu–Ven</span> 9h30–21h</div>
          <div><span className="about-hours-day">Sam</span> 9h30–17h</div>
          <div><span className="about-hours-day">Dim</span> 12h–16h</div>
        </div>
        <div className="about-contact-socials">
          <a href="https://www.facebook.com/lemercieralma/?locale=fr_CA" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.instagram.com/lemercieralma/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </div>

      <button className="btn-primary" onClick={() => goShop()}>MAGASINER</button>
    </main>
  );
}
