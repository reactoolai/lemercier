import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { fetchProducts, fetchCategories, fetchBrands } from '../lib/supabase.js';
import { setPageSEO } from '../lib/seo.js';

const PRICE_MIN = 0;
const PRICE_MAX = 800;
const PRICE_STEP = 10;

function Collapsible({ title, children, defaultOpen = true, badge = null }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-group">
      <button className="filter-head" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className="filter-head-right">
          {badge && <span className="filter-badge">{badge}</span>}
          <span className={'filter-chevron' + (open ? ' open' : '')}>▾</span>
        </span>
      </button>
      {open && <div className="filter-body">{children}</div>}
    </div>
  );
}

export default function SearchResults({ nav, query }) {
  const { openProduct, goHome, isAdmin, setEditingProduct, toggleWish, wish } = nav;
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 24;
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [sort, setSort] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const [localMin, setLocalMin] = useState(PRICE_MIN);
  const [localMax, setLocalMax] = useState(PRICE_MAX);

  useEffect(() => {
    setPageSEO('Recherche', `Résultats de recherche pour « ${query} » — Le Mercier Alma`);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    fetchProducts({ page, perPage, search: query, category, brand, inStockOnly, priceMin, priceMax, sort }).then(({ products: data, total }) => {
      setProducts(data);
      setTotalCount(total);
    }).catch(() => {}).finally(() => setLoading(false));
    fetchCategories(null).then(setCategories).catch(() => {});
    fetchBrands(null).then(setBrands).catch(() => {});
  }, [query, page, category, brand, inStockOnly, priceMin, priceMax, sort]);

  useEffect(() => { setPage(0); }, [query]);

  const totalPages = Math.ceil(totalCount / perPage);

  const filteredBrands = useMemo(() => {
    if (!brandQuery) return brands;
    const q = brandQuery.toLowerCase();
    return brands.filter(b => b.toLowerCase().includes(q));
  }, [brands, brandQuery]);

  const resetFilters = () => {
    setCategory(null); setBrand(null); setInStockOnly(false);
    setPriceMin(null); setPriceMax(null);
    setLocalMin(PRICE_MIN); setLocalMax(PRICE_MAX); setSort('default'); setPage(0);
  };

  const applyPrice = () => {
    setPriceMin(localMin > PRICE_MIN ? localMin : null);
    setPriceMax(localMax < PRICE_MAX ? localMax : null);
    setPage(0);
  };

  const activeFilters = [];
  if (category) activeFilters.push({ label: category, clear: () => { setCategory(null); setPage(0); } });
  if (brand) activeFilters.push({ label: brand, clear: () => { setBrand(null); setPage(0); } });
  if (inStockOnly) activeFilters.push({ label: 'En stock', clear: () => setInStockOnly(false) });
  if (priceMin != null) activeFilters.push({ label: `${priceMin}$+`, clear: () => { setPriceMin(null); setLocalMin(PRICE_MIN); } });
  if (priceMax != null) activeFilters.push({ label: `${priceMax}$ et moins`, clear: () => { setPriceMax(null); setLocalMax(PRICE_MAX); } });

  const Sidebar = (
    <aside className="shop-sidebar">
      <Collapsible title="Catégorie" badge={category ? 1 : null}>
        <div className="filter-list">
          <button className={'filter-item' + (!category ? ' on' : '')} onClick={() => { setCategory(null); setPage(0); }}>Toutes les catégories</button>
          {categories.map(c => (
            <button key={c} className={'filter-item' + (category === c ? ' on' : '')} onClick={() => { setCategory(c); setPage(0); }}>{c}</button>
          ))}
        </div>
      </Collapsible>
      <Collapsible title="Prix" defaultOpen={true} badge={priceMin != null || priceMax != null ? 1 : null}>
        <div className="price-filter">
          <div className="price-inputs">
            <div className="price-field"><label>Min</label><input type="number" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={localMin} onChange={e => setLocalMin(Math.min(Number(e.target.value), localMax))} /></div>
            <span className="price-dash">—</span>
            <div className="price-field"><label>Max</label><input type="number" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={localMax} onChange={e => setLocalMax(Math.max(Number(e.target.value), localMin))} /></div>
          </div>
          <div className="price-slider-row">
            <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={localMin} onChange={e => setLocalMin(Math.min(Number(e.target.value), localMax))} className="price-slider" />
            <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={localMax} onChange={e => setLocalMax(Math.max(Number(e.target.value), localMin))} className="price-slider" />
          </div>
          <div className="price-display">{localMin}$ — {localMax}${localMax >= PRICE_MAX ? '+' : ''}</div>
          <button className="price-apply" onClick={applyPrice}>Appliquer</button>
        </div>
      </Collapsible>
      <Collapsible title="Marque" badge={brand ? 1 : null} defaultOpen={false}>
        <input className="brand-search" type="text" placeholder="Rechercher une marque…" value={brandQuery} onChange={e => setBrandQuery(e.target.value)} />
        <div className="filter-list">
          <button className={'filter-item' + (!brand ? ' on' : '')} onClick={() => { setBrand(null); setPage(0); }}>Toutes les marques</button>
          {filteredBrands.map(b => (
            <button key={b} className={'filter-item' + (brand === b ? ' on' : '')} onClick={() => { setBrand(b); setPage(0); }}>{b}</button>
          ))}
        </div>
      </Collapsible>
      <Collapsible title="Disponibilité" badge={inStockOnly ? 1 : null} defaultOpen={false}>
        <label className="filter-check">
          <input type="checkbox" checked={inStockOnly} onChange={e => { setInStockOnly(e.target.checked); setPage(0); }} />
          <span className="filter-check-label">En stock seulement</span>
        </label>
      </Collapsible>
    </aside>
  );

  return (
    <main className="wrap page shop-layout">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Recherche</span>
      </div>
      <div className="shop-header">
        <div>
          <h1 className="page-title">{totalCount} résultat{totalCount !== 1 ? 's' : ''} pour « {query} »</h1>
        </div>
        <div className="shop-header-right">
          <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}>
            <option value="default">Trier: Pertinence</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="stock">En stock d'abord</option>
          </select>
          <button className="filter-toggle" onClick={() => setFiltersOpen(o => !o)}>
            Filtres {activeFilters.length > 0 && <span className="filter-count-badge">{activeFilters.length}</span>}
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="active-chips-bar">
          {activeFilters.map((f, i) => (
            <button key={i} className="active-chip" onClick={f.clear}>{f.label} ×</button>
          ))}
          <button className="active-clear" onClick={resetFilters}>Tout effacer</button>
        </div>
      )}

      <div className="shop-body">
        <div className={'shop-sidebar-wrap' + (filtersOpen ? ' open' : '')}>
          {filtersOpen && <div className="filter-close" onClick={() => setFiltersOpen(false)}>Fermer ✕</div>}
          {Sidebar}
        </div>
        {filtersOpen && <div className="shop-overlay" onClick={() => setFiltersOpen(false)} />}

        <div className="shop-main">
          {loading ? (
            <div className="shop-loading">
              <div className="shop-skeleton-grid">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <p className="muted">Aucun produit ne correspond à « {query} ».</p>
              <button className="btn-outline" onClick={() => { resetFilters(); }}>Voir tous les produits</button>
            </div>
          ) : (
            <>
              <div className="grid4">
                {products.map(p => <ProductCard key={p.id} p={p} openProduct={openProduct} toggleWish={toggleWish} wish={wish} isAdmin={isAdmin} setEditingProduct={setEditingProduct} />)}
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
        </div>
      </div>
    </main>
  );
}
