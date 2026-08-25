import { useState, useEffect, useRef } from 'react';
import { fmt } from '../data/products.js';
import { useCart } from '../context/CartContext.jsx';
import { setPageSEO } from '../lib/seo.js';

const SQUARE_SCRIPT = 'https://web.squarecdn.com/v1/square.js';

export default function Checkout({ nav, orderNumber }) {
  const { cart, subtotal, clear, cartToken, freeShippingThreshold, shippingFlat } = useCart();
  const { goShop, goHome } = nav;

  const [fulfillment, setFulfillment] = useState('delivery');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address1: '', address2: '', city: '', province: 'QC', postal_code: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [serverError, setServerError] = useState('');
  const [cardReady, setCardReady] = useState(false);
  const cardRef = useRef(null);
  const paymentsRef = useRef(null);
  const cardInstanceRef = useRef(null);

  useEffect(() => {
    setPageSEO('Commande', 'Finalisez votre commande chez Le Mercier Alma. Paiement sécurisé par Square.', '/commande');
  }, []);

  // Load Square SDK
  useEffect(() => {
    if (document.querySelector(`script[src="${SQUARE_SCRIPT}"]`)) {
      initSquare();
      return;
    }
    const script = document.createElement('script');
    script.src = SQUARE_SCRIPT;
    script.onload = initSquare;
    document.head.appendChild(script);
    return () => { if (cardInstanceRef.current) { try { cardInstanceRef.current.destroy(); } catch {} } };

    async function initSquare() {
      try {
        const appId = import.meta.env.VITE_SQUARE_APP_ID;
        const locId = import.meta.env.VITE_SQUARE_LOCATION_ID;
        if (!appId || !locId || !window.Square) { setServerError('Module de paiement indisponible'); return; }
        const payments = window.Square.payments(appId, locId);
        paymentsRef.current = payments;
        const card = await payments.card();
        cardInstanceRef.current = card;
        await card.attach('#card-container');
        setCardReady(true);
      } catch (e) {
        console.error('Square init error:', e.message);
        setServerError('Impossible de charger le module de paiement');
      }
    }
  }, []);

  if (cart.length === 0 && !orderNumber) {
    return (
      <main className="wrap page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 className="page-title">Votre panier est vide</h1>
        <p className="muted" style={{ marginTop: 8 }}>Ajoutez des articles avant de passer à la caisse.</p>
        <button className="btn-primary" onClick={goShop} style={{ marginTop: 24 }}>MAGASINER</button>
      </main>
    );
  }

  const shippingTotal = fulfillment === 'pickup' ? 0 : (subtotal >= freeShippingThreshold ? 0 : shippingFlat);
  const tps = Math.round((subtotal + shippingTotal) * 0.05 * 100) / 100;
  const tvq = Math.round((subtotal + shippingTotal) * 0.09975 * 100) / 100;
  const total = Math.round((subtotal + shippingTotal + tps + tvq) * 100) / 100;

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Requis';
    if (!form.last_name.trim()) e.last_name = 'Requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Courriel invalide';
    if (fulfillment === 'delivery') {
      if (!form.address1.trim()) e.address1 = 'Requis';
      if (!form.city.trim()) e.city = 'Requis';
      if (!form.postal_code.trim()) e.postal_code = 'Requis';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    if (!cardReady || !cardInstanceRef.current) { setServerError('Module de paiement non prêt'); return; }

    setProcessing(true);
    try {
      const { token, status } = await cardInstanceRef.current.tokenize();
      if (status !== 'OK' || !token) {
        setProcessing(false);
        setServerError('Impossible de traiter la carte. Vérifiez vos informations.');
        return;
      }

      const payload = {
        cart_token: cartToken,
        customer: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || undefined,
        },
        fulfillment_type: fulfillment,
        shipping: fulfillment === 'delivery' ? {
          address1: form.address1,
          address2: form.address2 || undefined,
          city: form.city,
          province: form.province,
          postal_code: form.postal_code,
        } : undefined,
        note: form.note || undefined,
        items: cart.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          color: it.color,
          size: it.size,
        })),
        payment_token: token,
      };

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setProcessing(false);
        setServerError(data.error || 'Erreur lors du traitement de la commande.');
        return;
      }

      clear();
      window.location.hash = '#/commande/confirmation/' + encodeURIComponent(data.order_number);
    } catch (e) {
      console.error('Checkout error:', e);
      setProcessing(false);
      setServerError('Erreur inattendue. Veuillez réessayer.');
    }
  };

  return (
    <main className="wrap page checkout-page">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Commande</span>
      </div>
      <h1 className="page-title">Finaliser ma commande</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          {/* Section 1: Coordonnées */}
          <section className="checkout-section">
            <h2 className="checkout-section-title">1. Vos coordonnées</h2>
            <div className="checkout-fields">
              <div className="checkout-field">
                <label>Prénom *</label>
                <input type="text" value={form.first_name} onChange={e => setField('first_name', e.target.value)} className={errors.first_name ? 'err' : ''} />
                {errors.first_name && <span className="field-err">{errors.first_name}</span>}
              </div>
              <div className="checkout-field">
                <label>Nom *</label>
                <input type="text" value={form.last_name} onChange={e => setField('last_name', e.target.value)} className={errors.last_name ? 'err' : ''} />
                {errors.last_name && <span className="field-err">{errors.last_name}</span>}
              </div>
              <div className="checkout-field">
                <label>Courriel *</label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className={errors.email ? 'err' : ''} />
                {errors.email && <span className="field-err">{errors.email}</span>}
              </div>
              <div className="checkout-field">
                <label>Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section 2: Mode de réception */}
          <section className="checkout-section">
            <h2 className="checkout-section-title">2. Mode de réception</h2>
            <div className="fulfillment-cards">
              <label className={'fulfillment-card' + (fulfillment === 'pickup' ? ' on' : '')}>
                <input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} />
                <div className="fulfillment-card-body">
                  <div className="fulfillment-card-title">Ramassage en boutique</div>
                  <div className="fulfillment-card-price">Gratuit</div>
                  <div className="fulfillment-card-detail">630 Rue Sacré-Coeur O, Alma (Québec)</div>
                  <div className="fulfillment-card-hours">
                    Lun–Mer 9h30–17h30 · Jeu–Ven 9h30–21h · Sam 9h30–17h · Dim 12h–16h
                  </div>
                </div>
              </label>
              <label className={'fulfillment-card' + (fulfillment === 'delivery' ? ' on' : '')}>
                <input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} />
                <div className="fulfillment-card-body">
                  <div className="fulfillment-card-title">Livraison</div>
                  <div className="fulfillment-card-price">{shippingFlat} $ · gratuite dès {freeShippingThreshold} $</div>
                  <div className="fulfillment-card-detail">Partout au Québec</div>
                </div>
              </label>
            </div>

            {fulfillment === 'delivery' && (
              <div className="checkout-fields shipping-fields">
                <div className="checkout-field full">
                  <label>Adresse *</label>
                  <input type="text" value={form.address1} onChange={e => setField('address1', e.target.value)} className={errors.address1 ? 'err' : ''} />
                  {errors.address1 && <span className="field-err">{errors.address1}</span>}
                </div>
                <div className="checkout-field full">
                  <label>Appartement, suite, etc.</label>
                  <input type="text" value={form.address2} onChange={e => setField('address2', e.target.value)} />
                </div>
                <div className="checkout-field">
                  <label>Ville *</label>
                  <input type="text" value={form.city} onChange={e => setField('city', e.target.value)} className={errors.city ? 'err' : ''} />
                  {errors.city && <span className="field-err">{errors.city}</span>}
                </div>
                <div className="checkout-field">
                  <label>Province</label>
                  <select value={form.province} onChange={e => setField('province', e.target.value)}>
                    <option value="QC">Québec</option>
                    <option value="ON">Ontario</option>
                    <option value="NB">Nouveau-Brunswick</option>
                    <option value="NS">Nouvelle-Écosse</option>
                    <option value="PE">Île-du-Prince-Édouard</option>
                    <option value="MB">Manitoba</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="AB">Alberta</option>
                    <option value="BC">Colombie-Britannique</option>
                    <option value="NL">Terre-Neuve-et-Labrador</option>
                  </select>
                </div>
                <div className="checkout-field">
                  <label>Code postal *</label>
                  <input type="text" value={form.postal_code} onChange={e => setField('postal_code', e.target.value.toUpperCase())} className={errors.postal_code ? 'err' : ''} placeholder="G8B 1M1" />
                  {errors.postal_code && <span className="field-err">{errors.postal_code}</span>}
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Paiement */}
          <section className="checkout-section">
            <h2 className="checkout-section-title">3. Paiement</h2>
            <div id="card-container" className="square-card-container" ref={cardRef} />
            {serverError && <div className="checkout-error">{serverError}</div>}
            <div className="checkout-field full">
              <label>Note (optionnel)</label>
              <textarea value={form.note} onChange={e => setField('note', e.target.value)} rows={2} placeholder="Instructions de livraison, etc." />
            </div>
            <button type="submit" className="btn-primary checkout-submit" disabled={processing || !cardReady}>
              {processing ? 'Traitement du paiement…' : `Payer ${fmt(total)}`}
            </button>
          </section>
        </form>

        {/* Récapitulatif */}
        <aside className="checkout-summary">
          <h2 className="checkout-summary-title">Récapitulatif</h2>
          <div className="checkout-items">
            {cart.map((it, i) => (
              <div key={i} className="checkout-item">
                <img src={it.image || it.img} alt={it.name} />
                <div className="checkout-item-info">
                  <div className="checkout-item-name">{it.name}</div>
                  {(it.color || it.size) && (
                    <div className="checkout-item-variant">
                      {it.color && it.color}{it.color && it.size ? ' · ' : ''}{it.size && `T.${it.size}`}
                    </div>
                  )}
                  <div className="checkout-item-qty">Qté: {it.quantity}</div>
                </div>
                <div className="checkout-item-price">{fmt(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="checkout-totals">
            <div className="row"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
            <div className="row"><span>Livraison</span><span>{shippingTotal === 0 ? 'Gratuite' : fmt(shippingTotal)}</span></div>
            <div className="row sm"><span>TPS (5 %)</span><span>{fmt(tps)}</span></div>
            <div className="row sm"><span>TVQ (9,975 %)</span><span>{fmt(tvq)}</span></div>
            <div className="row total"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
