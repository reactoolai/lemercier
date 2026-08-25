import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import ProductEditModal from '../components/ProductEditModal.jsx';
import { fmt } from '../data/products.js';

export default function Admin({ goHome }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Erreur: ' + error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        setSession(data.session);
      } else {
        setError('');
        setMode('login');
        setEmail('');
        setPassword('');
        alert('Compte créé! Vous pouvez maintenant vous connecter.');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return (
      <main className="wrap page" style={{ maxWidth: 420, paddingTop: 80 }}>
        <div className="admin-login-card">
          <h1 className="page-title" style={{ textAlign: 'center', fontSize: 28 }}>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 28 }}>{mode === 'login' ? 'Connectez-vous pour gérer la boutique' : 'Créez votre compte administrateur'}</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-field">
              <label>Courriel</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@lechoixdesophie.com" required />
            </div>
            <div className="admin-field">
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="admin-error">{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Veuillez patienter…' : mode === 'login' ? 'SE CONNECTER' : 'CRÉER LE COMPTE'}
            </button>
          </form>
          <div className="admin-mode-switch">
            {mode === 'login' ? (
              <span>Pas de compte? <button onClick={() => { setMode('signup'); setError(''); }}>Créer un compte</button></span>
            ) : (
              <span>Déjà un compte? <button onClick={() => { setMode('login'); setError(''); }}>Se connecter</button></span>
            )}
          </div>
          <button onClick={goHome} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, marginTop: 20, cursor: 'pointer' }}>← Retour à la boutique</button>
        </div>
      </main>
    );
  }

  return <AdminDashboard session={session} onLogout={handleLogout} goHome={goHome} />;
}

const STATUS_LABELS = {
  pending_payment: 'Paiement en attente',
  paid: 'Payée',
  preparing: 'En préparation',
  ready_for_pickup: 'Prête pour ramassage',
  shipping: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  pending_payment: 'low',
  paid: 'ok',
  preparing: 'ok',
  ready_for_pickup: 'ok',
  shipping: 'ok',
  delivered: 'ok',
  cancelled: 'out',
};

function AdminDashboard({ session, onLogout, goHome }) {
  const [tab, setTab] = useState('products');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .in('status', ['paid', 'preparing', 'ready_for_pickup', 'shipping'])
      .then(({ count }) => setPendingCount(count || 0));
  }, [tab]);

  return (
    <main className="wrap page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
        </div>
        <div className="admin-header-right">
          <button className="btn-outline" onClick={goHome}>Voir la boutique</button>
          <button className="admin-logout" onClick={onLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={'admin-tab' + (tab === 'products' ? ' on' : '')} onClick={() => setTab('products')}>Produits</button>
        <button className={'admin-tab' + (tab === 'orders' ? ' on' : '')} onClick={() => setTab('orders')}>
          Commandes{pendingCount > 0 && <span className="admin-tab-badge">{pendingCount}</span>}
        </button>
        <button className={'admin-tab' + (tab === 'carts' ? ' on' : '')} onClick={() => setTab('carts')}>Paniers non finalisés</button>
        <button className={'admin-tab' + (tab === 'newsletter' ? ' on' : '')} onClick={() => setTab('newsletter')}>Infolettre</button>
      </div>

      {tab === 'products' && <ProductsTab />}
      {tab === 'orders' && <OrdersTab session={session} />}
      {tab === 'carts' && <AbandonedCartsTab />}
      {tab === 'newsletter' && <NewsletterTab />}
    </main>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [variantCounts, setVariantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;

  const loadProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*', { count: 'exact' });
    if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,cat.ilike.%${search}%`);
    if (confidenceFilter === 'exact') query = query.eq('img_confidence', 'exact');
    if (confidenceFilter === 'approx') query = query.eq('img_confidence', 'approx');
    if (confidenceFilter === 'none') query = query.or('img.is.null,img.eq.');
    query = query.order('id', { ascending: true }).range(page * perPage, (page + 1) * perPage - 1);
    const { data, error, count } = await query;
    if (error) { console.error(error); }
    setProducts(data || []);
    setTotalCount(count || 0);

    if (data && data.length > 0) {
      const productIds = data.map(p => p.id);
      const { data: vData } = await supabase.from('product_variants').select('product_id').in('product_id', productIds);
      const counts = {};
      (vData || []).forEach(v => { counts[v.product_id] = (counts[v.product_id] || 0) + 1; });
      setVariantCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [page, search, confidenceFilter]);

  const totalPages = Math.ceil(totalCount / perPage);
  const handleSaved = () => { setEditing(null); loadProducts(); };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit et toutes ses variantes?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Erreur: ' + error.message); return; }
    loadProducts();
  };

  return (
    <>
      <div className="admin-search-bar">
        <input type="text" placeholder="Rechercher un produit…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select value={confidenceFilter} onChange={e => { setConfidenceFilter(e.target.value); setPage(0); }} className="admin-filter-select">
          <option value="all">Toutes les images</option>
          <option value="exact">Confiance: exact</option>
          <option value="approx">Confiance: approx (à réviser)</option>
          <option value="none">Sans image</option>
        </select>
        <button className="btn-outline btn-add-product" onClick={() => setEditing({})}>+ Ajouter un produit</button>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nom</th><th>Marque</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Couleurs</th><th>Image</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="admin-id">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.cat}</td>
                    <td>{Number(p.price).toFixed(2)}$</td>
                    <td><span className={'stock-pill' + (p.stock === 0 ? ' out' : p.stock <= 3 ? ' low' : ' ok')}>{p.stock}</span></td>
                    <td><span className="variant-count">{variantCounts[p.id] || 0}</span></td>
                    <td>
                      {p.img ? <img src={p.img} alt="" className="admin-thumb" /> : <span className="muted">—</span>}
                      {p.img_confidence === 'approx' && <span className="confidence-badge approx" title="Photo approximative — à réviser">approx</span>}
                      {p.img_confidence === 'exact' && <span className="confidence-badge exact" title="Photo officielle vérifiée">exact</span>}
                    </td>
                    <td>
                      <button className="admin-action" onClick={() => setEditing(p)}>Modifier</button>
                      <button className="admin-action danger" onClick={() => handleDelete(p.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span>Page {page + 1} sur {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </>
      )}

      {editing && <ProductEditModal product={editing} onSaved={handleSaved} onClose={() => setEditing(null)} />}
    </>
  );
}

function OrdersTab({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (fulfillmentFilter !== 'all') query = query.eq('fulfillment_type', fulfillmentFilter);
    if (search) query = query.or(`order_number.ilike.%${search}%,customer_first_name.ilike.%${search}%,customer_last_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) console.error(error);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, [search, statusFilter, fulfillmentFilter]);

  const openDetail = async (order) => {
    setSelected(order);
    setStatusMsg('');
    const [itemsRes, histRes] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', order.id).order('id', { ascending: true }),
      supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
    ]);
    setOrderItems(itemsRes.data || []);
    setHistory(histRes.data || []);
  };

  const updateStatus = async (newStatus) => {
    if (!selected) return;
    setStatusMsg('');
    const token = session?.access_token;
    if (!token) { setStatusMsg('Session expirée'); return; }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-order-status`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order_id: selected.id, status: newStatus }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      const updated = { ...selected, status: newStatus };
      setSelected(updated);
      setOrders(prev => prev.map(o => o.id === selected.id ? updated : o));
      const { data: hist } = await supabase.from('order_status_history').select('*').eq('order_id', selected.id).order('created_at', { ascending: true });
      setHistory(hist || []);
      const emailStatuses = ['preparing', 'ready_for_pickup', 'shipping', 'delivered'];
      setStatusMsg(emailStatuses.includes(newStatus) ? `Statut mis à jour — courriel envoyé à ${selected.customer_email}` : 'Statut mis à jour');
    } else {
      setStatusMsg(data.error || 'Erreur de mise à jour');
    }
  };

  return (
    <>
      <div className="admin-search-bar">
        <input type="text" placeholder="Rechercher (n°, nom, courriel, téléphone)…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={fulfillmentFilter} onChange={e => setFulfillmentFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Tous les modes</option>
          <option value="delivery">Livraison</option>
          <option value="pickup">Ramassage</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="muted">Aucune commande trouvée.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>N°</th><th>Date</th><th>Client</th><th>Courriel</th><th>Mode</th><th>Total</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="admin-row-clickable" onClick={() => openDetail(o)}>
                  <td className="admin-id">{o.order_number}</td>
                  <td>{new Date(o.created_at).toLocaleDateString('fr-CA')}</td>
                  <td>{o.customer_first_name} {o.customer_last_name}</td>
                  <td>{o.customer_email}</td>
                  <td>{o.fulfillment_type === 'pickup' ? 'Ramassage' : 'Livraison'}</td>
                  <td>{fmt(o.total)}</td>
                  <td><span className={'stock-pill ' + (STATUS_COLORS[o.status] || '')}>{STATUS_LABELS[o.status] || o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)} />
          <div className="admin-detail-panel">
            <div className="admin-detail-head">
              <h2>Commande {selected.order_number}</h2>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="admin-detail-body">
              <div className="admin-detail-section">
                <h3>Client</h3>
                <div>{selected.customer_first_name} {selected.customer_last_name}</div>
                <div>{selected.customer_email}</div>
                {selected.customer_phone && <div>{selected.customer_phone}</div>}
                {selected.fulfillment_type === 'delivery' ? (
                  <div className="admin-detail-addr">
                    {selected.ship_address1}{selected.ship_address2 ? `, ${selected.ship_address2}` : ''}<br />
                    {selected.ship_city}, {selected.ship_province} {selected.ship_postal_code}
                  </div>
                ) : (
                  <div className="admin-detail-addr">Ramassage en boutique — 630 Rue Sacré-Coeur O, Alma</div>
                )}
                {selected.customer_note && <div className="admin-detail-note">Note: {selected.customer_note}</div>}
                {selected.square_payment_id && <div className="admin-detail-meta">Square ID: {selected.square_payment_id}</div>}
              </div>

              <div className="admin-detail-section">
                <h3>Articles</h3>
                {orderItems.map((it, i) => (
                  <div key={i} className="admin-detail-item">
                    {it.image_url ? <img src={it.image_url} alt="" /> : <div className="admin-detail-noimg" />}
                    <div>
                      <div className="admin-detail-item-name">{it.name}</div>
                      {it.brand && <div className="muted">{it.brand}</div>}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {it.color && it.color}{it.color && it.size ? ' · ' : ''}{it.size && `T.${it.size}`} · Qté: {it.quantity}
                      </div>
                      <div className="admin-detail-item-price">{fmt(it.line_total)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-detail-section">
                <h3>Totaux</h3>
                <div className="admin-detail-totals">
                  <div className="row"><span>Sous-total</span><span>{fmt(selected.subtotal)}</span></div>
                  <div className="row"><span>Livraison</span><span>{selected.shipping_total === 0 ? 'Gratuite' : fmt(selected.shipping_total)}</span></div>
                  <div className="row sm"><span>TPS</span><span>{fmt(selected.tps)}</span></div>
                  <div className="row sm"><span>TVQ</span><span>{fmt(selected.tvq)}</span></div>
                  <div className="row total"><span>Total</span><span>{fmt(selected.total)}</span></div>
                </div>
              </div>

              <div className="admin-detail-section">
                <h3>Statut</h3>
                <div className="admin-detail-status-row">
                  <select value={selected.status} onChange={e => updateStatus(e.target.value)} className="admin-filter-select">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                {statusMsg && <div className="admin-detail-status-msg">{statusMsg}</div>}
              </div>

              {history.length > 0 && (
                <div className="admin-detail-section">
                  <h3>Historique</h3>
                  <div className="admin-detail-history">
                    {history.map((h, i) => (
                      <div key={i} className="admin-detail-history-item">
                        <span className={'stock-pill ' + (STATUS_COLORS[h.status] || '')}>{STATUS_LABELS[h.status] || h.status}</span>
                        <span className="muted">{new Date(h.created_at).toLocaleString('fr-CA')}</span>
                        {h.note && <span className="muted">{h.note}</span>}
                        {h.email_sent && <span className="admin-detail-email-sent">✓ Courriel envoyé</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AbandonedCartsTab() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailOnly, setEmailOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadCarts = async () => {
    setLoading(true);
    let query = supabase.from('abandoned_carts').select('*').eq('status', 'active').order('last_seen_at', { ascending: false });
    if (emailOnly) query = query.not('email', 'is', null).neq('email', '');
    const { data, error } = await query;
    if (error) console.error(error);
    setCarts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCarts(); }, [emailOnly]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `il y a ${diff} min`;
    if (diff < 1440) return `il y a ${Math.floor(diff / 60)} h`;
    return d.toLocaleDateString('fr-CA');
  };

  return (
    <>
      <div className="admin-search-bar">
        <label className="filter-check">
          <input type="checkbox" checked={emailOnly} onChange={e => setEmailOnly(e.target.checked)} />
          <span className="filter-check-label">Avec courriel seulement</span>
        </label>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : carts.length === 0 ? (
        <p className="muted">Aucun panier non finalisé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dernière activité</th><th>Courriel</th><th>Nom</th><th>Articles</th><th>Sous-total</th><th>Caisse</th><th></th>
              </tr>
            </thead>
            <tbody>
              {carts.map(c => (
                <>
                  <tr key={c.id} className="admin-row-clickable" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    <td>{formatDate(c.last_seen_at)}</td>
                    <td>{c.email || <span className="muted">inconnu</span>}</td>
                    <td>{[c.first_name, c.last_name].filter(Boolean).join(' ') || <span className="muted">—</span>}</td>
                    <td>{c.items_count || 0}</td>
                    <td>{fmt(c.subtotal || 0)}</td>
                    <td>{c.reached_checkout ? <span className="stock-pill ok">Atteinte</span> : <span className="muted">Non</span>}</td>
                    <td>{expanded === c.id ? '▾' : '▸'}</td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={c.id + '-detail'} className="admin-cart-detail-row">
                      <td colSpan={7}>
                        <div className="admin-cart-detail">
                          {(Array.isArray(c.items) ? c.items : []).map((it, i) => (
                            <div key={i} className="admin-cart-detail-item">
                              {it.image && <img src={it.image} alt="" className="admin-thumb" />}
                              <div>
                                <div>{it.name}</div>
                                <div className="muted" style={{ fontSize: 12 }}>
                                  {it.color && it.color}{it.color && it.size ? ' · ' : ''}{it.size && `T.${it.size}`} · Qté: {it.quantity}
                                </div>
                                <div className="muted" style={{ fontSize: 12 }}>{fmt(it.price)}</div>
                              </div>
                            </div>
                          ))}
                          {c.email && (
                            <a href={`mailto:${c.email}?subject=Vous avez oublié votre panier — Le Mercier Alma&body=Bonjour ${c.first_name || ''},%0D%0A%0D%0AVous avez laissé des articles dans votre panier sur notre boutique. N'hésitez pas à revenir compléter votre commande!%0D%0A%0D%0A— Le Mercier Alma`} className="btn-outline admin-cart-relance">
                              Relancer par courriel
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NewsletterTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setSubs(data || []);
        setLoading(false);
      });
  }, []);

  const exportCSV = () => {
    const csv = ['email,source,date_inscription'];
    for (const s of subs) {
      csv.push(`${s.email},${s.source || 'footer'},${new Date(s.created_at).toISOString()}`);
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infolettre_abonnes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="admin-search-bar">
        <div className="result-count">{subs.length} abonnés</div>
        <button className="btn-outline" onClick={exportCSV} disabled={subs.length === 0}>Exporter CSV</button>
      </div>
      {loading ? (
        <p className="muted">Chargement…</p>
      ) : subs.length === 0 ? (
        <p className="muted">Aucun abonné pour le moment.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Courriel</th><th>Source</th><th>Date d'inscription</th></tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.source || '—'}</td>
                  <td>{new Date(s.created_at).toLocaleDateString('fr-CA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
