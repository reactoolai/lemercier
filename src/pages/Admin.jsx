import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import ProductEditModal from '../components/ProductEditModal.jsx';

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

function AdminDashboard({ session, onLogout, goHome }) {
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

  const handleSaved = () => {
    setEditing(null);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit et toutes ses variantes?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Erreur: ' + error.message); return; }
    loadProducts();
  };

  return (
    <main className="wrap page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <div className="result-count">{totalCount} produits</div>
        </div>
        <div className="admin-header-right">
          <button className="btn-outline" onClick={() => setEditing({})}>+ Ajouter un produit</button>
          <button className="btn-outline" onClick={goHome}>Voir la boutique</button>
          <button className="admin-logout" onClick={onLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="admin-search-bar">
        <input type="text" placeholder="Rechercher un produit…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select value={confidenceFilter} onChange={e => { setConfidenceFilter(e.target.value); setPage(0); }} className="admin-filter-select">
          <option value="all">Toutes les images</option>
          <option value="exact">Confiance: exact</option>
          <option value="approx">Confiance: approx (à réviser)</option>
          <option value="none">Sans image</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Marque</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Couleurs</th>
                  <th>Image</th>
                  <th>Actions</th>
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
                    <td>
                      <span className={'stock-pill' + (p.stock === 0 ? ' out' : p.stock <= 3 ? ' low' : ' ok')}>{p.stock}</span>
                    </td>
                    <td>
                      <span className="variant-count">{variantCounts[p.id] || 0}</span>
                    </td>
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
    </main>
  );
}
