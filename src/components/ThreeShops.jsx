const BOUTIQUES = [
  { name: 'Le Mercier Alma', desc: 'Mercerie pour homme à Alma — chemises, costumes, polos et accessoires de marques sélectionnées, avec ajustements sur mesure en boutique.', link: 'https://lemercieralma.com', logo: '/assets/lemercier-logo.jpg' },
  { name: 'Attitude Sports', desc: 'Vêtements et chaussures de sport pour toute la famille — performance, confort et style au quotidien.', link: 'https://attitudesport.ca', logo: '/assets/attitudesport-logo.png' },
];

export default function ThreeShops() {
  return (
    <section className="three-shops">
      <div className="wrap boutiques-wrap">
        <div className="boutiques-head">
          <div className="surtitre">Nos deux adresses</div>
          <h2>Découvrez nos deux autres boutiques</h2>
          <p>Deux autres adresses, une même passion du vêtement bien choisi.</p>
        </div>
        <div className="boutiques-grid boutiques-grid-two">
          {BOUTIQUES.map((b) => (
            <div className="boutique-card" key={b.name}>
              <div className="boutique-img">
                <img src={b.logo} alt={b.name} style={{ objectFit: 'contain', padding: '40px', background: 'var(--cream)' }} />
              </div>
              <div className="boutique-body">
                <img src={b.logo} alt="" width="40" style={{ marginBottom: '12px', opacity: '.8' }} />
                <h3>{b.name}</h3>
                <p>{b.desc}</p>
                <a href={b.link} target="_blank" rel="noopener noreferrer" className="btn-outline boutique-btn">Visiter</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
