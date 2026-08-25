export default function Footer({ goShop, goAbout, goContact }) {
  return (
    <footer className="ftr">
      <div className="ftr-top">
        <div className="wrap ftr-grid">
          <div className="ftr-col ftr-brand">
            <div className="ftr-logo"><img src="/logo.jpg" alt="Le Mercier Alma" /><span>LE MERCIER — ALMA</span></div>
            <p className="ftr-desc">Boutique de vêtements pour homme à Alma. Marques sélectionnées, service personnalisé et ajustements sur mesure.</p>
            <div className="ftr-socials">
              <a href="https://www.facebook.com/lemercieralma/?locale=fr_CA" target="_blank" rel="noopener noreferrer" aria-label="Facebook Le Mercier Alma" className="ftr-social">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/lemercieralma/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Le Mercier Alma" className="ftr-social">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          <div className="ftr-col">
            <div className="ftr-col-title">Boutique</div>
            <ul className="ftr-col-links">
              <li><span onClick={() => goShop('Nouveautés')}>Nouveautés</span></li>
              <li><span onClick={() => goShop('Vêtements')}>Vêtements</span></li>
              <li><span onClick={() => goShop('Accessoires')}>Accessoires</span></li>
              <li><span onClick={() => goShop('Soldes')}>Soldes</span></li>
              <li><span onClick={goAbout}>À propos</span></li>
            </ul>
          </div>

          <div className="ftr-col">
            <div className="ftr-col-title">Service</div>
            <ul className="ftr-col-links">
              <li><span>Livraison 25 $ · offerte dès 200 $</span></li>
              <li><span>Retour sous 30 jours</span></li>
              <li><span>Ajustements sur mesure</span></li>
              <li><span>Certificats cadeaux</span></li>
            </ul>
          </div>

          <div className="ftr-col">
            <div className="ftr-col-title">Nous joindre</div>
            <ul className="ftr-col-links ftr-contact">
              <li className="ftr-addr"><span onClick={goContact} style={{ cursor: 'pointer' }}>630 Rue Sacré-Coeur O, Alma, QC</span></li>
              <li><a href="tel:+14186623240">(418) 662-3240</a></li>
              <li className="ftr-hours">
                <span className="ftr-hours-day">Lun–Mer</span> 9h30–17h30<br />
                <span className="ftr-hours-day">Jeu–Ven</span> 9h30–21h<br />
                <span className="ftr-hours-day">Sam</span> 9h30–17h<br />
                <span className="ftr-hours-day">Dim</span> 12h–16h
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ftr-bottom">
        <div className="wrap ftr-bottom-row">
          <div className="ftr-copy">© {new Date().getFullYear()} Le Mercier Alma — Tous droits réservés</div>
          <div className="ftr-bottom-links">
            <span>Politique de confidentialité</span>
            <span>Livraison et retour</span>
          </div>
          <a className="ftr-powered" href="https://reactool.ai" target="_blank" rel="noopener noreferrer" aria-label="Propulsé par Reactool AI">
            <span>Propulsé par</span>
            <img src="/logo_blanc_reactool_ai.png" alt="Reactool AI" />
          </a>
        </div>
      </div>
    </footer>
  );
}
