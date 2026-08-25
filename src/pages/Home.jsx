import { useEffect, useState, useRef } from 'react';
import { HERO_IMG } from '../data/products.js';
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
  const [banners, setBanners] = useState([]);
  const [uploadingCat, setUploadingCat] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(null);
  const [uploadErr, setUploadErr] = useState('');
  const fileRefs = useRef({});
  const bannerRefs = useRef({});

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
    supabase.from('collection_banners').select('*').order('sort_order', { ascending: true }).then(({ data }) => {
      if (data) setBanners(data);
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

  const handleBannerUpload = async (bannerId, files) => {
    if (!files || files.length === 0) return;
    setUploadingBanner(bannerId);
    setUploadErr('');
    try {
      const file = files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      const fileName = `banner-${bannerId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      const { error: dbErr } = await supabase.from('collection_banners').update({ img: url }).eq('id', bannerId);
      if (dbErr) throw dbErr;
      setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, img: url } : b));
    } catch (e) {
      setUploadErr(e.message || 'Erreur upload');
    }
    setUploadingBanner(null);
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
          ['Livraison et retour', 'Livraison 25 $, offerte dès 200 $. Retour facile sous 30 jours.']].map(([t, d]) => (
          <div key={t} className="service"><div className="service-title">{t}</div><p>{d}</p></div>
        ))}
      </section>

      <section className="wrap">
        <div className="sec-head"><h2>Collections</h2><span className="muted-tag">NOS SÉLECTIONS</span></div>
        <div className="collection-banners">
          {banners.map(b => (
            <div key={b.id} className="collection-banner" onClick={() => nav.goCategory(b.category)}>
              <div className="collection-banner-img">
                {b.img ? (
                  <img src={b.img} alt={b.title} loading="lazy" />
                ) : (
                  <div className="collection-banner-placeholder">{b.title}</div>
                )}
                {isAdmin && (
                  <button
                    className="cat-tile-edit"
                    onClick={(e) => { e.stopPropagation(); bannerRefs.current[b.id]?.click(); }}
                    disabled={uploadingBanner === b.id}
                    title="Changer la photo"
                  >
                    {uploadingBanner === b.id ? '…' : '📷'}
                  </button>
                )}
                {isAdmin && (
                  <input
                    ref={el => { bannerRefs.current[b.id] = el; }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); handleBannerUpload(b.id, e.target.files); e.target.value = ''; }}
                  />
                )}
              </div>
              <div className="collection-banner-overlay">
                <div className="collection-banner-title">{b.title}</div>
                <button className="btn-outline collection-banner-btn">VOIR LA COLLECTION</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-band">
        <div className="wrap split">
          <div>
            <h2>Une mercerie élégante, maintenant chez vous</h2>
            <p>Née à Saint-Georges de Beauce, la boutique Le Mercier ouvre ses portes à Alma. Un mélange unique de vêtements pour homme alliant le chic et le décontracté, avec un service personnalisé et des ajustements sur mesure.</p>
          </div>
          <div className="split-r">
            <div className="split-tag">NOUS JOINDRE</div>
            <div>630 Rue Sacré-Coeur O, Alma (Québec)</div>
            <div><a href="tel:+14186623240" style={{ color: '#C6CEDD', textDecoration: 'none' }}>(418) 662-3240</a></div>
            <div className="split-hours">
              <span><span className="split-hours-day">Lun–Mer</span> 9h30–17h30</span>
              <span><span className="split-hours-day">Jeu–Ven</span> 9h30–21h</span>
              <span><span className="split-hours-day">Sam</span> 9h30–17h</span>
              <span><span className="split-hours-day">Dim</span> 12h–16h</span>
            </div>
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
