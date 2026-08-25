import { useEffect } from 'react';
import { setPageSEO } from '../lib/seo.js';
import ThreeShops from '../components/ThreeShops.jsx';

const IMG_STOREFRONT = '/costume.webp';
const IMG_BEAUCE = '/chemise_extensible.webp';
const IMG_ALMA = '/shorts.webp';
const IMG_BRANDS = '/costume.webp';
const IMG_TAILORING = '/chemise_extensible.webp';

export default function About({ goShop }) {
  useEffect(() => {
    setPageSEO('À propos', 'Le Mercier Alma — boutique de vêtements pour homme à Alma, Québec. Née à Saint-Georges de Beauce, la boutique offre marques sélectionnées, service personnalisé et ajustements sur mesure.', '/a-propos');
  }, []);

  return (
    <main className="wrap page about-page">
      <div className="about-hero">
        <div className="about-hero-img">
          <img src={IMG_STOREFRONT} alt="Le Mercier Alma" loading="eager" fetchpriority="high" width="1200" height="500" />
        </div>
        <div className="about-hero-overlay">
          <h1 className="about-hero-title">À propos du Mercier</h1>
          <p className="about-hero-sub">Plus de 30 ans de passion du vêtement bien choisi, maintenant à Alma.</p>
        </div>
      </div>

      <section className="about-section">
        <div className="about-section-text">
          <h2>De Saint-Georges à Alma</h2>
          <p>Née il y a plus de 30 ans au cœur de Saint-Georges de Beauce, la boutique Le Mercier s'est bâtie une réputation de mercerie élégante, alliant le chic et le décontracté. Au fil des années, c'est devenu une destination prisée pour l'homme qui cherche des marques soigneusement choisies et un service attentionné.</p>
          <p>Aujourd'hui, Le Mercier s'installe à Alma pour servir les hommes du Lac-Saint-Jean avec la même passion. Vous nous trouverez en ligne et en boutique, avec un choix de chemises, costumes, polos, tricots et accessoires des marques que vous aimez.</p>
        </div>
        <div className="about-section-img">
          <img src={IMG_BEAUCE} alt="Saint-Georges de Beauce" loading="lazy" width="600" height="450" />
        </div>
      </section>

      <section className="about-section reverse">
        <div className="about-section-text">
          <h2>L'arrivée à Alma</h2>
          <p>Alma est une ville fière de ses racines et de son sens de l'accueil. C'est naturellement que Le Mercier a choisi de s'y établir, au 630 Rue Sacré-Coeur O, pour offrir aux hommes de la région une expérience d'achat personnalisée, loin des grands centres commerciaux.</p>
          <p>Notre équipe vous accueille dans une atmosphère chaleureuse, où le conseil est roi. Que vous cherchiez un costume pour un mariage, une chemise pour le bureau ou un cadeau pour un être cher, nous prenons le temps de vous comprendre.</p>
        </div>
        <div className="about-section-img">
          <img src={IMG_ALMA} alt="Alma, Lac-Saint-Jean" loading="lazy" width="600" height="450" />
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-text">
          <h2>Des marques sélectionnées</h2>
          <p>Nous choisissons chaque marque et chaque pièce avec soin. Vous trouverez chez nous des collections de NZA, Psycho Bunny, Au Noir, Lacoste, Soul of London et bien d'autres — des marques qui partagent notre exigence de qualité et notre sens du style.</p>
          <p>De la chemise sans pli au costume sur mesure, du polo d'été au tricot d'hiver, notre sélection couvre toutes les saisons et toutes les occasions.</p>
        </div>
        <div className="about-section-img">
          <img src={IMG_BRANDS} alt="Marques sélectionnées" loading="lazy" width="600" height="450" />
        </div>
      </section>

      <section className="about-section reverse">
        <div className="about-section-text">
          <h2>Ajustements sur mesure</h2>
          <p>Le service qui nous distingue: nos ajustements sur mesure, réalisés directement en boutique par nos conseillers. Une chemise trop longue? Un pantalon à ourler? Une veste à reprendre? Nous nous en occupons, pour que chaque vêtement vous aille comme un gant.</p>
          <p>C'est cette attention au détail, ce refus du « one size fits all », qui fait la différence Le Mercier. Votre vêtement doit vous ressembler.</p>
        </div>
        <div className="about-section-img">
          <img src={IMG_TAILORING} alt="Ajustements sur mesure" loading="lazy" width="600" height="450" />
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-text">
          <h2>Service-conseil personnalisé</h2>
          <p>Chez Le Mercier, le service ne s'arrête pas à la caisse. Nos conseillers prennent le temps de comprendre votre style, vos besoins et votre budget. Graduation, mariage, retour au travail ou simplement envie de vous faire plaisir: nous sommes là pour vous guider.</p>
          <p>Et parce que nous savons que votre temps est précieux, vous pouvez aussi magasiner en ligne, avec livraison partout au Québec et ramassage gratuit en boutique.</p>
        </div>
      </section>

      <section className="about-contact-block">
        <h2 className="about-contact-block-title">La boutique</h2>
        <div className="about-contact-grid">
          <div className="about-contact-info">
            <div className="about-contact-row"><strong>Adresse</strong><br />630 Rue Sacré-Coeur O, Alma (Québec) G8B 1M1</div>
            <div className="about-contact-row"><strong>Téléphone</strong><br /><a href="tel:+14186623240">(418) 662-3240</a></div>
            <div className="about-contact-row"><strong>Courriel</strong><br /><a href="mailto:info@lechoixdesophie.com">info@lechoixdesophie.com</a></div>
            <div className="about-contact-row"><strong>Heures d'ouverture</strong>
              <div className="about-contact-hours">
                <div><span className="about-hours-day">Lun–Mer</span> 9h30–17h30</div>
                <div><span className="about-hours-day">Jeu–Ven</span> 9h30–21h</div>
                <div><span className="about-hours-day">Sam</span> 9h30–17h</div>
                <div><span className="about-hours-day">Dim</span> 12h–16h</div>
              </div>
            </div>
            <div className="about-contact-row">
              <strong>Carte Google</strong><br />
              <a href="https://share.google/R42uJTULG09BJZrZo" target="_blank" rel="noopener noreferrer">Voir sur Google Maps</a>
            </div>
            <div className="about-contact-socials">
              <a href="https://www.facebook.com/lemercieralma/?locale=fr_CA" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://www.instagram.com/lemercieralma/" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
          <div className="about-contact-map">
            <iframe
              src="https://www.google.com/maps?q=630+Rue+Sacré-Coeur+O,+Alma,+QC&output=embed"
              title="Carte Le Mercier Alma"
              loading="lazy"
              style={{ width: '100%', height: '100%', border: 0, borderRadius: 12, minHeight: 320 }}
            />
          </div>
        </div>
      </section>

      <ThreeShops />

      <div className="about-cta">
        <button className="btn-primary" onClick={() => goShop()}>MAGASINER</button>
      </div>
    </main>
  );
}
