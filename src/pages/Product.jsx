import { useState, useEffect, useRef } from 'react';
import { fmt } from '../data/products.js';
import { supabase, fetchProductById } from '../lib/supabase.js';
import { setProductSEO, resetSEO } from '../lib/seo.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Product(nav) {
  const { product: fallback, pid, openProduct, isAdmin, setEditingProduct, productRefreshKey } = nav;
  const [p, setP] = useState(fallback);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [size, setSize] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef(null);

  useEffect(() => {
    setSize(null);
    setSimilar([]);
    setSelectedVariant(null);
    setVariants([]);
    setActiveImg(0);
    setZoom(false);
    if (!pid) return;
    setP(null);
    fetchProductById(pid).then(full => {
      if (full) {
        setP(full);
        setProductSEO(full);
        supabase.from('product_variants').select('*').eq('product_id', full.id).order('created_at', { ascending: true }).then(({ data, error }) => {
          if (!error && data) {
            const mapped = data.map(v => ({
              ...v,
              sizes: Array.isArray(v.sizes) ? v.sizes : [],
              photos: Array.isArray(v.photos) ? v.photos : (v.img ? [v.img] : []),
            }));
            setVariants(mapped);
            if (mapped.length > 0) setSelectedVariant(0);
          }
        });
        supabase.from('products').select('*').eq('cat', full.cat).neq('id', full.id).limit(4).then(({ data, error }) => {
          if (!error && data) {
            setSimilar(data.map(x => ({ ...x, price: Number(x.price), sizes: Array.isArray(x.sizes) ? x.sizes : [] })));
          }
        });
      }
    });
  }, [pid, productRefreshKey]);

  useEffect(() => {
    return () => resetSEO();
  }, []);

  const currentVariant = selectedVariant !== null ? variants[selectedVariant] : null;

  const variantPhotos = currentVariant?.photos || [];
  const galleryImages = [];
  if (currentVariant && variantPhotos.length > 0) {
    galleryImages.push(...variantPhotos);
  }
  if (p?.img && !galleryImages.includes(p.img)) galleryImages.unshift(p.img);
  if (p?.gallery && Array.isArray(p.gallery)) {
    p.gallery.forEach(url => { if (!galleryImages.includes(url)) galleryImages.push(url); });
  }

  const displayImg = galleryImages[activeImg] || galleryImages[0] || p?.img;
  const displaySizes = currentVariant?.sizes?.length > 0 ? currentVariant.sizes : (p?.sizes || []);
  const displayStock = currentVariant ? currentVariant.stock : p?.stock;

  const handleMouseMove = (e) => {
    if (!imgWrapRef.current) return;
    const rect = imgWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  if (!p) return <main className="wrap page"><p className="muted">Produit introuvable.</p></main>;

  return (
    <main className="wrap page">
      <div className="crumbs"><span onClick={nav.goHome}>Accueil</span> / <span onClick={() => nav.goShop()}>Boutique</span> / {p.name}</div>
      <div className="prod-grid">
        <div className="prod-img-col">
          <div
            className={'prod-img-zoom-wrap' + (zoom ? ' zooming' : '')}
            ref={imgWrapRef}
            onMouseEnter={() => displayImg && setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
          >
            {displayImg ? (
              <img
                src={displayImg}
                alt={p.name}
                className="prod-img-main"
                style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              />
            ) : (
              <div className="no-img">Pas d'image</div>
            )}
            {zoom && displayImg && <div className="prod-zoom-hint">Survolez pour zoomer</div>}
          </div>
          {galleryImages.length > 1 && (
            <div className="prod-thumbs">
              {galleryImages.map((url, i) => (
                <button
                  key={i}
                  className={'prod-thumb' + (activeImg === i ? ' on' : '')}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={url} alt={`Vue ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="prod-info">
          <div className="card-brand">{(p.brand || '').toUpperCase()}</div>
          <h1>{p.name}</h1>
          {isAdmin && (
            <button className="admin-edit-inline" onClick={() => setEditingProduct(p)}>✎ Modifier ce produit</button>
          )}
          <div className="prod-ref">Réf. {p.sku || p.id}</div>
          <div className="prod-price">{fmt(p.price)}</div>
          {displayStock !== undefined && displayStock !== null && (
            <div className={displayStock > 0 ? 'stock-ok' : 'stock-out'}>
              {displayStock > 0 ? `En stock (${displayStock} unité${displayStock > 1 ? 's' : ''})` : 'Rupture de stock'}
            </div>
          )}
          {p.color && <div className="muted">Saison : {p.color}</div>}
          {p.cat && <div className="muted">Catégorie : {p.cat}</div>}

          {variants.length > 0 && (
            <>
              <div className="size-label">COULEURS</div>
              <div className="chips color-chips">
                {variants.map((v, i) => (
                  <button
                    key={v.id || i}
                    className={'color-dot' + (selectedVariant === i ? ' on' : '')}
                    style={{ background: v.color || '#000' }}
                    onClick={() => { setSelectedVariant(i); setSize(null); setActiveImg(0); }}
                    title={v.color_name || v.color || ''}
                  />
                ))}
              </div>
              {currentVariant?.color_name && (
                <div className="selected-color-name">{currentVariant.color_name}</div>
              )}
            </>
          )}

          {displaySizes.length > 0 && (
            <>
              <div className="size-label">GRANDEUR</div>
              <div className="chips">{displaySizes.map(s => <button key={s} className={'chip sq' + (size === s ? ' on' : '')} onClick={() => setSize(s)}>{s}</button>)}</div>
            </>
          )}
          <button className="btn-primary big" disabled={displayStock === 0} onClick={() => nav.addToCart({ name: p.name, img: displayImg, price: p.price, size: size || (displaySizes[0]) || '', color: currentVariant?.color_name || currentVariant?.color || '' })}>
            {displayStock === 0 ? 'ÉPUISÉ' : 'AJOUTER AU PANIER'}
          </button>
          <div className="prod-note">Livraison partout au Québec · Retour en boutique sous 30 jours · Ajustements sur mesure offerts à Alma</div>
        </div>
      </div>
      {similar.length > 0 && (
        <>
          <h2 className="sim-title">Produits similaires</h2>
          <div className="grid4">{similar.map(x => <ProductCard key={x.id} p={x} {...nav} openProduct={openProduct} />)}</div>
        </>
      )}
    </main>
  );
}
