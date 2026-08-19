import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { fmt } from '../data/products.js';

export default function ProductCard({ p, openProduct, toggleWish, wish, addToCart, isAdmin, setEditingProduct }) {
  const wished = wish.includes(p.id);
  const inStock = p.stock > 0;
  const [variants, setVariants] = useState([]);
  const displayImg = p.img || (Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery[0] : '');

  useEffect(() => {
    if (!p.id) return;
    supabase.from('product_variants').select('color,color_name,img,sizes').eq('product_id', p.id).order('created_at', { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) setVariants(data);
    });
  }, [p.id]);

  return (
    <div className="card" onClick={() => openProduct(p.id)}>
      <div className="card-img">
        {displayImg ? (
          <img src={displayImg} alt={p.name} loading="lazy" />
        ) : (
          <div className="card-noimg">
            <span>{(p.brand || '').charAt(0)}</span>
          </div>
        )}
        {isAdmin && (
          <button className="card-edit-btn" onClick={e => { e.stopPropagation(); setEditingProduct(p); }}>✎ Modifier</button>
        )}
        <button className={'wish-btn' + (wished ? ' on' : '')} onClick={e => { e.stopPropagation(); toggleWish(p.id); }}>{wished ? '♥' : '♡'}</button>
        {p.stock === 0 && <span className="stock-badge">Épuisé</span>}
        {p.stock > 0 && p.stock <= 3 && <span className="stock-badge low">Bientôt épuisé</span>}
        {inStock && (
          <button className="card-add-btn" onClick={e => { e.stopPropagation(); addToCart({ name: p.name, img: displayImg, price: p.price, size: (p.sizes && p.sizes[0]) || '' }); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>Ajouter</span>
          </button>
        )}
      </div>
      <div className="card-brand">{(p.brand || '').toUpperCase()}</div>
      <div className="card-name">{p.name}</div>
      <div className="card-price">{fmt(p.price)}</div>
      {variants.length > 0 && (
        <div className="card-variants-info">
          <div className="card-colors">
            {variants.slice(0, 6).map((v, i) => (
              <span
                key={i}
                className="card-color-dot"
                style={{ background: v.color || '#000' }}
                title={v.color_name || v.color || ''}
              />
            ))}
            {variants.length > 6 && <span className="card-color-more">+{variants.length - 6}</span>}
          </div>
          {(() => {
            const allSizes = [...new Set(variants.flatMap(v => Array.isArray(v.sizes) ? v.sizes : []))];
            if (allSizes.length === 0) return null;
            return (
              <div className="card-sizes-mini">
                {allSizes.slice(0, 8).map(s => <span key={s} className="card-size-mini">{s}</span>)}
                {allSizes.length > 8 && <span className="card-size-more">+{allSizes.length - 8}</span>}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
