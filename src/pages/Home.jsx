import { useEffect, useState, useRef } from 'react';
import { HERO_IMG, LOOKBOOK } from '../data/products.js';
import { fetchProducts, supabase } from '../lib/supabase.js';
import ProductCard from '../components/ProductCard.jsx';

const FEATURED_IDS = ['09S15PSP', '05S7BHTP'];
const HIDDEN_IDS = ['08149', '08149X'];

const CATEGORY_TILES = [
  'Chemises',
  'Polos',
  'Tricots & Cardigans',
  'Pantalons',
  'Vestes & Costumes',
  'Shorts & Bermudas',
  'Chaussures',
  'Accessoires',
];

async function uploadCategoryImage(file, category) {
  const safe = category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `cat-${safe}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
  const url = urlData.publicUrl;
  const { error: upErr } = await supabase.from('category_images').upsert({ category, img: url }, { onConflict: 'category' });
  if (upErr) throw upErr;
  return url;
}

export default function Home(nav) {
  const { isAdmin, productRefreshKey } = nav;
  const [featured, setFeatured] = useState([]);
  const [catImages, setCatImages] = useState({});
  const [uploadingCat, setUploadingCat] = useState(null);
  const [uploadErr, setUploadErr] = useState('');
  const fileRefs = useRef({});

  useEffect(() => {
    Promise.all([
      fetchProducts({ page: 0, perPage: 8, inStockOnly: true }),
      ...FEATURED_IDS.map(id => supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => data)),
    ]).then(([res, ...featuredRows]) => {
      const featured = featuredRows.filter(Boolean).map(p => ({
        ...p,
        price: Number(p.price),
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
      }));
      const rest = (res.products || []).filter(p => !FEATURED_IDS.includes(p.id) && !HIDDEN_IDS.includes(p.id));
      setFeatured([...featured, ...rest].slice(0, 8));
    }).catch(() => {});
  }, [productRefreshKey]);

  useEffect(() => {
    supabase.from('category_images').select('category,img').then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(r => { map[r.category] = r.img; });
        setCatImages(map);
      }
    });
  }, []);

  const handleCatUpload = async (category, files) => {
    if (!files || files.length === 0) return;
    setUploadingCat(category);
    setUploadErr('');
    try {
      const url = await uploadCategoryImage(files[0], category);
      setCatImages(prev => ({ ...prev, [category]: url }));
    } catch (e) {
      setUploadErr(e.message || 'Erreur upload');
    }
    setUploadingCat(null);
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-tag"><span className="rule" />AUTOMNE 2026</div>
            <h1>La nouvelle saison est arrivée</h1>
            <p>Chemises, tricots et vestes des collections NZA, Psycho Bunny et Au Noir — sélectionnés pour l'homme d'ici. Désormais à Alma.</p>
            <div className="hero-cta">
              <button className="btn-primary" onClick={() => nav.goShop('Nouveautés')}>DÉCOUVRIR LA SAISON</button>
              <button className="btn-outline" onClick={() => nav.goShop(null)}>MAGASINER</button>
            </div>
          </div>
          <div className="hero-img"><img src={HERO_IMG} alt="Nouvelle saison" /></div>
        </div>
      </section>

      <section className="wrap duo">
        <div className="duo-navy" onClick={() => nav.goShop('Nouveautés')}>
          <div className="duo-ghost">CC</div>
          <div className="duo-tag">SÉLECTION DE LA SAISON</div>
          <div className="duo-title">Coups de cœur</div>
          <div className="duo-link">VOIR LA SÉLECTION</div>
        </div>
        <div className="duo-white" onClick={() => nav.goShop('Soldes')}>
          <div className="duo-ghost">%</div>
          <div className="duo-tag">JUSQU'À -50 %</div>
          <div className="duo-title navy">Soldes de saison</div>
          <div className="duo-link navy">EN PROFITER</div>
        </div>
      </section>

      <div className="wrap brands">
        <span>NZA NEW ZEALAND</span><span>PSYCHO BUNNY</span><span>AU NOIR</span><span>LACOSTE</span><span>SOUL OF LONDON</span>
      </div>

      <section className="wrap">
        <div className="sec-head">
          <h2>Nos rayons</h2>
          <span className="muted-tag">PARCOUREZ PAR CATÉGORIE</span>
        </div>
        {uploadErr && <div className="admin-error" style={{ marginBottom: 12 }}>{uploadErr}</div>}
        <div className="cat-tiles-grid">
          {CATEGORY_TILES.map(cat => {
            const img = catImages[cat];
            return (
              <div key={cat} className="cat-tile" onClick={() => nav.goCategory(cat)}>
                <div className="cat-tile-img">
                  {img ? (
                    <img src={img} alt={cat} loading="lazy" />
                  ) : (
                    <div className="cat-tile-placeholder">{cat.charAt(0)}</div>
                  )}
                  {isAdmin && (
                    <button
                      className="cat-tile-edit"
                      onClick={(e) => { e.stopPropagation(); fileRefs.current[cat]?.click(); }}
                      disabled={uploadingCat === cat}
                      title="Changer la photo"
                    >
                      {uploadingCat === cat ? '…' : '📷'}
                    </button>
                  )}
                  {isAdmin && (
                    <input
                      ref={el => { fileRefs.current[cat] = el; }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); handleCatUpload(cat, e.target.files); e.target.value = ''; }}
                    />
                  )}
                </div>
                <div className="cat-tile-label">{cat}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head"><h2>Nouveautés</h2><span className="see-all" onClick={() => nav.goShop('Nouveautés')}>Tout voir</span></div>
        <div className="grid4">
          {featured.length > 0
            ? featured.map(p => <ProductCard key={p.id} p={p} {...nav} />)
            : <p className="muted">Chargement…</p>}
        </div>
      </section>

      <section className="wrap services">
        {[['Sur mesure', 'Complets et chemises ajustés directement en boutique par nos conseillers.'],
          ['Graduation et mariage', "Un service d'habillage complet pour vos grands événements."],
          ['Certificats cadeaux', 'Le cadeau parfait, offert en ligne et en boutique.'],
          ['Livraison et retour', 'Livraison partout au Québec, retour facile sous 30 jours.']].map(([t, d]) => (
          <div key={t} className="service"><div className="service-title">{t}</div><p>{d}</p></div>
        ))}
      </section>

      <section className="wrap">
        <div className="sec-head"><h2>Lookbook</h2><span className="muted-tag">LA COLLECTION PORTÉE</span></div>
        <div className="lookbook">{LOOKBOOK.map((src, i) => <img key={i} src={src} alt={'Lookbook ' + (i + 1)} className={i % 2 ? 'offset' : ''} />)}</div>
      </section>

      <section className="about-band">
        <div className="wrap split">
          <div>
            <h2>Une mercerie élégante, maintenant chez vous</h2>
            <p>Née à Saint-Georges de Beauce, la boutique Le Mercier ouvre ses portes à Alma. Un mélange unique de vêtements pour homme alliant le chic et le décontracté, avec un service personnalisé et des ajustements sur mesure.</p>
          </div>
          <div className="split-r">
            <div className="split-tag">NOUS JOINDRE</div>
            <div>Adresse à confirmer, Alma (Québec)</div>
            <div>Lun–Mer 9h30 à 17h30 · Jeu–Ven 9h30 à 21h</div>
            <div>Sam 9h30 à 17h · Dim 12h à 16h</div>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <h2>Inscrivez-vous à notre infolettre</h2>
        <p>Nouveautés, soldes et événements en boutique.</p>
        <div className="nl-row"><input placeholder="Votre courriel" /><button className="btn-primary">S'INSCRIRE</button></div>
      </section>
    </main>
  );
}
