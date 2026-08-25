import { navigate } from '../lib/router.js';

const SHOPS = [
  {
    name: 'Le Mercier Alma',
    tag: 'Vous êtes ici',
    desc: 'Mercerie pour homme à Alma — chemises, costumes, polos et accessoires de marques sélectionnées, avec ajustements sur mesure en boutique.',
    link: '/',
    external: false,
    current: true,
    placeholder: 'LM',
  },
  {
    name: 'Le Choix de Sophie',
    tag: 'Mode féminine',
    desc: 'Mode féminine à Alma — des pièces choisies une à une, du chic décontracté au glamour urbain.',
    link: 'https://lechoixdesophie.com',
    external: true,
    placeholder: 'CS',
  },
  {
    name: 'Attitude Sports',
    tag: 'Vêtements de sport',
    desc: 'Vêtements et chaussures de sport pour toute la famille — performance, confort et style au quotidien.',
    link: 'https://attitudesport.ca',
    external: true,
    placeholder: 'AS',
  },
];

export default function ThreeShops() {
  return (
    <section className="three-shops">
      <div className="wrap">
        <div className="three-shops-head">
          <h2 className="three-shops-title">Découvrez nos trois boutiques</h2>
          <p className="three-shops-sub">Trois adresses, une même passion du vêtement bien choisi.</p>
        </div>
        <div className="three-shops-grid">
          {SHOPS.map((s) => {
            const Card = (
              <div className={'three-shops-card' + (s.current ? ' current' : '')}>
                {s.current && <div className="three-shops-badge">Vous êtes ici</div>}
                <div className="three-shops-img">
                  <span className="three-shops-placeholder">{s.placeholder}</span>
                </div>
                <div className="three-shops-body">
                  <div className="three-shops-tag">{s.tag}</div>
                  <h3 className="three-shops-name">{s.name}</h3>
                  <p className="three-shops-desc">{s.desc}</p>
                </div>
                <div className="three-shops-cta">
                  {s.external
                    ? `Visiter ${s.name}`
                    : 'Magasiner'}
                  <span className="three-shops-arrow">→</span>
                </div>
              </div>
            );
            if (s.external) {
              return (
                <a key={s.name} href={s.link} target="_blank" rel="noopener noreferrer" className="three-shops-link">
                  {Card}
                </a>
              );
            }
            return (
              <div key={s.name} className="three-shops-link" onClick={() => navigate(s.link)} style={{ cursor: 'pointer' }}>
                {Card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
