import { useState, useEffect } from 'react';
import { products as staticProducts } from './data/products.js';
import { supabase, fetchProducts, fetchCategories, fetchBrands } from './lib/supabase.js';
import { CartProvider } from './context/CartContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Wishlist from './pages/Wishlist.jsx';
import About from './pages/About.jsx';
import Admin from './pages/Admin.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import ProductEditModal from './components/ProductEditModal.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [section, setSection] = useState(null);
  const [pid, setPid] = useState('1');
  const [confirmOrderNumber, setConfirmOrderNumber] = useState(null);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      const m = hash.match(/^#\/produit\/(.+)$/);
      const c = hash.match(/^#\/commande\/confirmation\/(.+)$/);
      if (c) {
        setConfirmOrderNumber(decodeURIComponent(c[1]));
        setView('confirmation');
      } else if (m) {
        setPid(decodeURIComponent(m[1]));
        setView('product');
      } else if (hash === '#/boutique') {
        setView('shop');
      } else if (hash === '#/a-propos') {
        setView('about');
      } else if (hash === '#/liste') {
        setView('wish');
      } else if (hash === '#/admin') {
        setView('admin');
      } else if (hash === '#/commande') {
        setView('checkout');
      } else if (!hash || hash === '#/') {
        setView('home');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [search, setSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [sort, setSort] = useState('default');
  const [wish, setWish] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState(staticProducts);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  const perPage = 24;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setIsAdmin(!!sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchProducts({ page: 0, perPage }).then(({ products: data, total }) => {
      if (data && data.length > 0) { setProducts(data); setTotalCount(total); }
    }).catch(() => {}).finally(() => setLoading(false));
    fetchCategories(null).then(setAllCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (view !== 'shop') return;
    setLoading(true);
    fetchProducts({ page, perPage, section, category, brand, search, inStockOnly, priceMin, priceMax, sort }).then(({ products: data, total }) => {
      setProducts(data);
      setTotalCount(total);
    }).catch(() => {}).finally(() => setLoading(false));
    fetchCategories(section).then(setCategories).catch(() => {});
    fetchBrands(section).then(setBrands).catch(() => {});
  }, [view, page, section, category, brand, search, inStockOnly, sort]);

  const nav = {
    goHome: () => { window.location.hash = ''; setView('home'); },
    goShop: (s = null) => {
      setSection(s);
      setCategory(null);
      setBrand(null);
      setPriceMin(null);
      setPriceMax(null);
      setInStockOnly(false);
      setPage(0);
      setSort('default');
      window.location.hash = '#/boutique';
      setView('shop');
    },
    goCategory: (c) => {
      setSection(null);
      setCategory(c);
      setBrand(null);
      setPriceMin(null);
      setPriceMax(null);
      setInStockOnly(false);
      setPage(0);
      setSort('default');
      window.location.hash = '#/boutique';
      setView('shop');
    },
    goAbout: () => { window.location.hash = '#/a-propos'; setView('about'); },
    goAdmin: () => { window.location.hash = '#/admin'; setView('admin'); },
    goWish: () => { window.location.hash = '#/liste'; setView('wish'); },
    goCheckout: () => { window.location.hash = '#/commande'; setView('checkout'); },
    openProduct: id => { window.location.hash = '#/produit/' + encodeURIComponent(id); setPid(id); setView('product'); },
    toggleCart: () => setCartOpen(o => !o),
    setQuery: q => { setSearch(q); setPage(0); setView('shop'); },
    search,
    addToCart: item => { setCart(c => [...c, item]); setCartOpen(true); },
    toggleWish: id => setWish(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]),
    wish,
    loading,
    products, totalCount, categories, brands, page, setPage, perPage,
    section, category, setCategory, brand, setBrand, inStockOnly, setInStockOnly, priceMin, setPriceMin, priceMax, setPriceMax, sort, setSort,
    isAdmin, setEditingProduct,
    pid, productRefreshKey,
  };

  const refreshProducts = () => {
    fetchProducts({ page, perPage, section, category, brand, search, inStockOnly, priceMin, priceMax, sort }).then(({ products: data, total }) => {
      setProducts(data);
      setTotalCount(total);
    }).catch(() => {});
  };

  const handleProductSaved = (updated, isDelete) => {
    setEditingProduct(null);
    refreshProducts();
    setProductRefreshKey(k => k + 1);
    if (updated && view === 'product') {
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated, price: Number(updated.price), sizes: Array.isArray(updated.sizes) ? updated.sizes : [] } : p));
    }
    if (isDelete && view === 'product') {
      setView('shop');
    }
  };

  const prod = products.find(p => p.id === pid) || products[0];
  return (
    <CartProvider>
      <div className="app">
        <Header {...nav} wishCount={wish.length} allCategories={allCategories} />
        {view === 'home' && <Home {...nav} />}
        {view === 'shop' && <Shop {...nav} />}
        {view === 'product' && <Product {...nav} product={prod} pid={pid} />}
        {view === 'wish' && <Wishlist {...nav} />}
        {view === 'about' && <About {...nav} />}
        {view === 'admin' && <Admin {...nav} />}
        {view === 'checkout' && <Checkout nav={nav} />}
        {view === 'confirmation' && <OrderConfirmation nav={nav} orderNumber={confirmOrderNumber} />}
        <Footer goShop={nav.goShop} goAbout={nav.goAbout} />
        {cartOpen && <CartDrawer close={() => setCartOpen(false)} goCheckout={nav.goCheckout} />}
        {editingProduct && <ProductEditModal product={editingProduct} onSaved={handleProductSaved} onClose={() => setEditingProduct(null)} />}
      </div>
    </CartProvider>
  );
}
