import { useState, useEffect } from 'react';
import { supabase, fetchProductById, fetchProducts } from '../lib/supabase.js';
import { fmt } from '../data/products.js';
import { setProductSEO } from '../lib/seo.js';
import { useCart } from '../context/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Product(nav) {
  const { pid, product, openProduct, toggleWish, wish, goShop, goCategory, productRefreshKey, isAdmin, setEditingProduct } = nav;
  const { add: addToCart } = useCart();

  const [full, setFull] = useState(product || null);
  const [loading, setLoading] = useState(!product || product.id !== pid);
  const [variants, setVariants] = useState([]);
  const [related, setRelated] = useState([]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let p = product && String(product.id) === String(pid) ? product : null;
      if (!p) {
        setLoading(true);
        p = await fetchProductById(pid);
      }
      if (cancelled) return;
      if (!p) { setFull(null); setLoading(false); return; }

      const { data: vData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      const mapped = (vData || []).map(v => ({
        ...v,
        sizes: (Array.isArray(v.sizes) && v.sizes.length > 0) ? v.sizes : (Array.isArray(p.sizes) ? [...p.sizes] : []),
        photos: Array.isArray(v.photos) ? v.photos : (v.img ? [v.img] : []),
      }));

      setFull(p);
      setVariants(mapped);
      setSelectedColor(0);
      setSelectedSize('');
      setActiveImg(0);
      setAdded(false);
      setLoading(false);
      setProductSEO(p);

      if (p.cat) {
        const { products: rel } = await fetchProducts({ page: 0, perPage: 5, category: p.cat });
        if (cancelled) return;
        setRelated((rel || []).filter(r => String(r.id) !== String(p.id)).slice(0, 4));
      }
    })();
    return () => { cancelled = true; };
  }, [pid, productRefreshKey]);

  if (loading) {
    return <main className="wrap page"><p className="muted">Chargement…</p></main>;
  }

  if (!full) {
    return (
      <main className="wrap page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 className="page-title">Produit introuvable</h1>
        <p className="muted">Ce produit n'est plus disponible.</p>
        <button className="btn-outline" onClick={goShop} style={{ marginTop: 20 }}>Retour à la boutique</button>
      </main>
    );
  }

  const wished = wish.includes(full.id);
  const inStock = full.stock > 0;

  const galleryImages = [
    ...(full.img ? [full.img] : []),
    ...(Array.isArray(full.gallery) ? full.gallery : []),
  ];
  const variantPhotos = variants.flatMap(v => v.photos || []);
  const allImages = [...galleryImages, ...variantPhotos.filter(u => !galleryImages.includes(u))];
  const displayImages = allImages.length > 0 ? allImages : [];

  const currentVariant = variants[selectedColor] || null;
  const currentSizes = currentVariant ? currentVariant.sizes : (Array.isArray(full.sizes) ? full.sizes : []);

  const handleAddToCart = () => {
    const img = displayImages[activeImg] || displayImages[0] || '';
    addToCart({
      product_id: full.id,
      sku: full.sku || '',
      name: full.name,
      brand: full.brand || '',
      image: img,
      color: currentVariant ? (currentVariant.color_name || currentVariant.color || '') : '',
      size: selectedSize || (currentSizes[0] || ''),
      price: full.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <main className="wrap page">
      <div className="breadcrumb">
        <button onClick={nav.goHome}>Accueil</button>
        <span>›</span>
        <button onClick={() => goCategory(full.cat)}>{full.cat}</button>
        <span>›</span>
        <span>{full.name}</span>
      </div>

      <div className="product-layout">
        <div className="product-gallery">
          {displayImages.length > 0 ? (
            <>
              <div className="product-main-img">
                <img src={displayImages[activeImg] || displayImages[0]} alt={full.name} />
                {isAdmin && (
                  <button className="card-edit-btn" onClick={() => setEditingProduct(full)}>✎ Modifier</button>
                )}
              </div>
              {displayImages.length > 1 && (
                <div className="product-thumbs">
                  {displayImages.map((url, i) => (
                    <button
                      key={i}
                      className={'product-thumb' + (i === activeImg ? ' on' : '')}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="product-noimg"><span>{(full.brand || '').charAt(0)}</span></div>
          )}
        </div>

        <div className="product-info">
          <div className="product-brand">{(full.brand || '').toUpperCase()}</div>
          <h1 className="product-name">{full.name}</h1>
          <div className="product-price">{fmt(full.price)}</div>

          {full.desc && <p className="product-desc">{full.desc}</p>}

          <div className="product-stock">
            {inStock ? (
              <span className="stock-pill ok">En stock</span>
            ) : (
              <span className="stock-pill out">Épuisé</span>
            )}
          </div>

          {variants.length > 0 && (
            <div className="product-section">
              <div className="product-section-label">Couleur{variants.length > 1 ? 's' : ''}</div>
              <div className="product-colors">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    className={'color-dot' + (i === selectedColor ? ' on' : '')}
                    style={{ background: v.color || '#000' }}
                    title={v.color_name || v.color || ''}
                    onClick={() => { setSelectedColor(i); setSelectedSize(''); }}
                  />
                ))}
                {currentVariant && currentVariant.color_name && (
                  <span className="product-color-name">{currentVariant.color_name}</span>
                )}
              </div>
            </div>
          )}

          {currentSizes.length > 0 && (
            <div className="product-section">
              <div className="product-section-label">Taille</div>
              <div className="product-sizes">
                {currentSizes.map(s => (
                  <button
                    key={s}
                    className={'size-toggle' + (selectedSize === s ? ' on' : '')}
                    onClick={() => setSelectedSize(s)}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="product-actions">
            <button
              className="btn-primary"
              onClick={handleAddToCart}
              disabled={!inStock}
            >{added ? '✓ Ajouté' : 'Ajouter au panier'}</button>
            <button
              className={'btn-outline wish-toggle' + (wished ? ' on' : '')}
              onClick={() => toggleWish(full.id)}
            >{wished ? '♥ Dans la liste' : '♡ Ajouter aux souhaits'}</button>
          </div>

          <div className="product-features">
            <table>
              <tbody>
                <tr><th>Marque</th><td>{full.brand || '—'}</td></tr>
                <tr><th>Catégorie</th><td>{full.cat || '—'}</td></tr>
                <tr><th>Prix</th><td>{fmt(full.price)}</td></tr>
                {full.sku && (
                  <tr>
                    <th>Réf.</th>
                    <td>
                      <span className="product-sku">{full.sku}</span>
                      <button className="product-sku-copy" onClick={() => { navigator.clipboard?.writeText(full.sku); setCopiedSku(true); setTimeout(() => setCopiedSku(false), 2000); }}>
                        {copiedSku ? '✓ Copié' : 'Copier'}
                      </button>
                    </td>
                  </tr>
                )}
                {full.sizes && full.sizes.length > 0 && (
                  <tr><th>Tailles</th><td>{full.sizes.join(', ')}</td></tr>
                )}
                {variants.length > 0 && (
                  <tr><th>Couleurs</th><td>{variants.map(v => v.color_name || v.color).join(', ')}</td></tr>
                )}
                <tr><th>Disponibilité</th><td>{inStock ? 'En stock' : 'Épuisé'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="product-related">
          <h2>Vous aimerez aussi</h2>
          <div className="grid4">
            {related.map(p => <ProductCard key={p.id} p={p} {...nav} />)}
          </div>
        </section>
      )}
    </main>
  );
}
