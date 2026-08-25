const SHOPS = [
  {
    name: 'Le Choix de Sophie',
    tag: 'Mode féminine',
    desc: 'Mode féminine à Alma — des pièces choisies une à une, du chic décontracté au glamour urbain.',
    link: 'https://lechoixdesophie.com',
    logo: '/lechoixdesophie-logo.jpg',
  },
  {
    name: 'Attitude Sports',
    tag: 'Vêtements de sport',
    desc: 'Vêtements et chaussures de sport pour toute la famille — performance, confort et style au quotidien.',
    link: 'https://attitudesport.ca',
    logo: '/attitudesport-logo.png',
  },
];

export default function ThreeShops() {
  return (
    <section className="three-shops">
      <div className="wrap">
        <div className="three-shops-head">
          <h2 className="three-shops-title">Nos boutiques partenaires</h2>
          <p className="three-shops-sub">Deux univers, une même passion du vêtement bien choisi.</p>
        </div>
        <div className="three-shops-grid">
          {SHOPS.map((s) => (
            <a key={s.name} href={s.link} target="_blank" rel="noopener noreferrer" className="three-shops-link">
              <div className="three-shops-card">
                <div className="three-shops-img">
                  <img src={s.logo} alt={s.name} className="three-shops-logo" />
                </div>
                <div className="three-shops-body">
                  <div className="three-shops-tag">{s.tag}</div>
                  <h3 className="three-shops-name">{s.name}</h3>
                  <p className="three-shops-desc">{s.desc}</p>
                  <div className="three-shops-cta">
                    Visiter le site
                    <span className="three-shops-arrow">→</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
