import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Wishlist(nav) {
  const [list, setList] = useState([]);
  const { wish } = nav;

  useEffect(() => {
    if (wish.length === 0) { setList([]); return; }
    supabase.from('products').select('*').in('id', wish).then(({ data, error }) => {
      if (!error && data) {
        setList(data.map(p => ({ ...p, price: Number(p.price), sizes: Array.isArray(p.sizes) ? p.sizes : [] })));
      }
    });
  }, [wish]);

  return (
    <main className="wrap page">
      <h1 className="page-title">Liste de souhaits</h1>
      {list.length === 0 ? (
        <div>
          <p className="muted">Votre liste est vide. Cliquez le cœur sur un produit pour l'ajouter.</p>
          <button className="btn-primary" onClick={() => nav.goShop()}>MAGASINER</button>
        </div>
      ) : <div className="grid4">{list.map(p => <ProductCard key={p.id} p={p} {...nav} />)}</div>}
    </main>
  );
}
