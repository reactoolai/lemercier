import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { fmt } from '../data/products.js';
import { setPageSEO } from '../lib/seo.js';

export default function OrderConfirmation({ nav, orderNumber }) {
  const { goShop, goHome } = nav;
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageSEO('Confirmation de commande', 'Votre commande chez Le Mercier Alma a été confirmée.');
  }, []);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    (async () => {
      const { data: o } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (o) {
        setOrder(o);
        const { data: oi } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', o.id)
          .order('id', { ascending: true });
        setItems(oi || []);
      }
      setLoading(false);
    })();
  }, [orderNumber]);

  if (loading) {
    return <main className="wrap page"><p className="muted">Chargement…</p></main>;
  }

  if (!order) {
    return (
      <main className="wrap page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 className="page-title">Commande introuvable</h1>
        <p className="muted">Nous n'avons pas trouvé cette commande.</p>
        <button className="btn-primary" onClick={goHome} style={{ marginTop: 24 }}>Retour à l'accueil</button>
      </main>
    );
  }

  const isPickup = order.fulfillment_type === 'pickup';

  return (
    <main className="wrap page confirmation-page">
      <div className="confirmation-hero">
        <div className="confirmation-check">✓</div>
        <h1 className="page-title">Merci pour votre commande !</h1>
        <p className="confirmation-subtitle">
          Votre commande <strong>{order.order_number}</strong> a été confirmée.
        </p>
        <p className="confirmation-email-sent">
          Un courriel de confirmation a été envoyé à {order.customer_email}.
        </p>
      </div>

      <div className="confirmation-layout">
        <div className="confirmation-main">
          <section className="confirmation-section">
            <h2 className="confirmation-section-title">Articles</h2>
            <div className="confirmation-items">
              {items.map((it, i) => (
                <div key={i} className="checkout-item">
                  {it.image_url ? <img src={it.image_url} alt={it.name} /> : <div className="checkout-item-noimg" />}
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{it.name}</div>
                    {it.brand && <div className="checkout-item-variant">{it.brand}</div>}
                    {(it.color || it.size) && (
                      <div className="checkout-item-variant">
                        {it.color && it.color}{it.color && it.size ? ' · ' : ''}{it.size && `T.${it.size}`}
                      </div>
                    )}
                    <div className="checkout-item-qty">Qté: {it.quantity}</div>
                  </div>
                  <div className="checkout-item-price">{fmt(it.line_total)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="confirmation-section">
            <h2 className="confirmation-section-title">Mode de réception</h2>
            {isPickup ? (
              <div className="confirmation-fulfillment">
                <strong>Ramassage en boutique</strong><br />
                630 Rue Sacré-Coeur O, Alma (Québec) G8B 1M1<br />
                <span className="muted">Lun–Mer 9h30–17h30 · Jeu–Ven 9h30–21h · Sam 9h30–17h · Dim 12h–16h</span>
              </div>
            ) : (
              <div className="confirmation-fulfillment">
                <strong>Livraison</strong><br />
                {order.ship_address1}{order.ship_address2 ? `, ${order.ship_address2}` : ''}<br />
                {order.ship_city}, {order.ship_province} {order.ship_postal_code}
              </div>
            )}
          </section>

          {order.customer_note && (
            <section className="confirmation-section">
              <h2 className="confirmation-section-title">Note</h2>
              <p className="confirmation-note">{order.customer_note}</p>
            </section>
          )}
        </div>

        <aside className="confirmation-summary">
          <h2 className="checkout-summary-title">Récapitulatif</h2>
          <div className="checkout-totals">
            <div className="row"><span>Sous-total</span><span>{fmt(order.subtotal)}</span></div>
            <div className="row"><span>Livraison</span><span>{order.shipping_total === 0 ? 'Gratuite' : fmt(order.shipping_total)}</span></div>
            <div className="row sm"><span>TPS (5 %)</span><span>{fmt(order.tps)}</span></div>
            <div className="row sm"><span>TVQ (9,975 %)</span><span>{fmt(order.tvq)}</span></div>
            <div className="row total"><span>Total</span><span>{fmt(order.total)}</span></div>
          </div>
          <div className="confirmation-status">
            <span className="stock-pill ok">Payée</span>
          </div>
        </aside>
      </div>

      <div className="confirmation-actions">
        <button className="btn-primary" onClick={goShop}>Continuer mes achats</button>
      </div>
    </main>
  );
}
