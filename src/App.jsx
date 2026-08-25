import { useState, useEffect, useCallback } from 'react';
import { products as staticProducts } from './data/products.js';
import { supabase, fetchProducts, fetchCategories, fetchBrands, searchByExactSkuOrId } from './lib/supabase.js';
import { CartProvider } from './context/CartContext.jsx';
import { matchRoute, navigate, redirectOldHash, productSlug, categorySlug, parseProductSlug } from './lib/router.js';
import { slugify } from './lib/router.js';
import { resetSEO } from './lib/seo.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Wishlist from './pages/Wishlist.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Privacy from './pages/Privacy.jsx';
import ShippingReturns from './pages/ShippingReturns.jsx';
import ThreeShops from './components/ThreeShops.jsx';
import Newsletter from './components/Newsletter.jsx';
import Admin from './pages/Admin.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import SearchResults from './pages/SearchResults.jsx';
import ProductEditModal from './components/ProductEditModal.jsx';

export default function App() {
  const [route, setRoute] = useState(() => {
    redirectOldHash();
    return matchRoute(window.location.pathname);
  });
  const [section, setSection] = useState(null);
  const [pid, setPid] = useState(null);
  const [confirmOrderNumber, setConfirmOrderNumber] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shopCategory, setShopCategory] = useState(null);

  useEffect(() => {
    const onPop = () => {
      const r = matchRoute(window.location.pathname);
      setRoute(r);
      if (r.name === 'product' && r.param) {
        setPid(parseProductSlug(window.location.pathname) || r.param);
      }
      if (r.name === 'confirmation') {
        setConfirmOrderNumber(r.param);
      }
      if (r.name === 'search') {
        const params = new URLSearchParams(window.location.search);
        setSearchQuery(params.get('q') || '');
      }
      if (r.name === 'shop' && r.param) {
        setShopCategory(r.param);
      } else if (r.name === 'shop') {
        setShopCategory(null);
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (route.name === 'product' && route.param) {
      setPid(parseProductSlug(window.location.pathname) || route.param);
    }
    if (route.name === 'confirmation') {
      setConfirmOrderNumber(route.param);
    }
    if (route.name === 'search') {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') || '');
    }
    if (route.name === 'shop' && route.param) {
      setShopCategory(route.param);
    } else if (route.name === 'shop') {
      setShopCategory(null);
    }
    if (route.name === 'home') {
      resetSEO();
    }
  }, [route]);

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
    if (route.name !== 'shop') return;
    setLoading(true);
    const resolvedCat = shopCategory
      ? (allCategories.find(c => slugify(c) === shopCategory) || shopCategory)
      : category;
    fetchProducts({ page, perPage, section, category: resolvedCat, brand, search, inStockOnly, priceMin, priceMax, sort }).then(({ products: data, total }) => {
      setProducts(data);
      setTotalCount(total);
    }).catch(() => {}).finally(() => setLoading(false));
    fetchCategories(section).then(setCategories).catch(() => {});
    fetchBrands(section).then(setBrands).catch(() => {});
  }, [route, page, section, shopCategory, category, brand, search, inStockOnly, sort, allCategories]);

  const goHome = useCallback(() => navigate('/'), []);
  const goShop = useCallback((s = null) => {
    setSection(s);
    setCategory(null);
    setShopCategory(null);
    setBrand(null);
    setPriceMin(null);
    setPriceMax(null);
    setInStockOnly(false);
    setPage(0);
    setSort('default');
    navigate('/boutique');
  }, []);
  const goCategory = useCallback((c) => {
    setSection(null);
    setCategory(null);
    setShopCategory(slugify(c));
    setBrand(null);
    setPriceMin(null);
    setPriceMax(null);
    setInStockOnly(false);
    setPage(0);
    setSort('default');
    navigate(`/boutique/${categorySlug(c)}`);
  }, []);
  const goAbout = useCallback(() => navigate('/a-propos'), []);
  const goContact = useCallback(() => navigate('/nous-joindre'), []);
  const goAdmin = useCallback(() => navigate('/admin'), []);
  const goWish = useCallback(() => navigate('/liste-de-souhaits'), []);
  const goCheckout = useCallback(() => navigate('/commande'), []);

  const openProduct = useCallback((id) => {
    setPid(id);
    const prod = products.find(p => String(p.id) === String(id));
    const slug = prod ? productSlug(prod) : id;
    navigate(`/produit/${slug}`);
  }, [products]);

  const goSearch = useCallback(async (q) => {
    if (!q || !q.trim()) return;
    const trimmed = q.trim();
    const exactId = await searchByExactSkuOrId(trimmed);
    if (exactId) {
      openProduct(exactId);
    } else {
      setSearchQuery(trimmed);
      navigate(`/recherche?q=${encodeURIComponent(trimmed)}`);
    }
  }, [openProduct]);

  const toggleCart = useCallback(() => setCartOpen(o => !o), []);
  const setQuery = useCallback((q) => { setSearch(q); setPage(0); }, []);
  const addToCart = useCallback((item) => { setCart(c => [...c, item]); setCartOpen(true); }, []);
  const toggleWish = useCallback((id) => setWish(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]), []);

  const nav = {
    goHome, goShop, goCategory, goAbout, goContact, goAdmin, goWish, goCheckout, goSearch,
    openProduct, toggleCart, setQuery, search,
    addToCart, toggleWish, wish,
    loading,
    products, totalCount, categories, brands, page, setPage, perPage,
    section, category, setCategory, brand, setBrand, inStockOnly, setInStockOnly, priceMin, setPriceMin, priceMax, setPriceMax, sort, setSort,
    isAdmin, setEditingProduct,
    pid, productRefreshKey,
  };

  const refreshProducts = () => {
    const resolvedCat = shopCategory
      ? (allCategories.find(c => slugify(c) === shopCategory) || shopCategory)
      : category;
    fetchProducts({ page, perPage, section, category: resolvedCat, brand, search, inStockOnly, priceMin, priceMax, sort }).then(({ products: data, total }) => {
      setProducts(data);
      setTotalCount(total);
    }).catch(() => {});
  };

  const handleProductSaved = (updated, isDelete) => {
    setEditingProduct(null);
    refreshProducts();
    setProductRefreshKey(k => k + 1);
    if (updated && route.name === 'product') {
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated, price: Number(updated.price), sizes: Array.isArray(updated.sizes) ? updated.sizes : [] } : p));
    }
    if (isDelete && route.name === 'product') {
      goShop();
    }
  };

  const prod = pid ? (products.find(p => String(p.id) === String(pid)) || null) : null;

  return (
    <CartProvider>
      <div className="app">
        <Header {...nav} wishCount={wish.length} allCategories={allCategories} />
        {route.name === 'home' && <Home {...nav} />}
        {route.name === 'shop' && <Shop {...nav} category={shopCategory ? (allCategories.find(c => slugify(c) === shopCategory) || shopCategory) : category} />}
        {route.name === 'product' && <Product {...nav} product={prod} pid={pid} />}
        {route.name === 'wish' && <Wishlist {...nav} />}
        {route.name === 'about' && <About {...nav} />}
        {route.name === 'contact' && <Contact {...nav} />}
        {route.name === 'admin' && <Admin {...nav} />}
        {route.name === 'checkout' && <Checkout nav={nav} />}
        {route.name === 'confirmation' && <OrderConfirmation nav={nav} orderNumber={confirmOrderNumber} />}
        {route.name === 'search' && <SearchResults nav={nav} query={searchQuery} />}
        {route.name === 'privacy' && <Privacy goHome={nav.goHome} />}
        {route.name === 'shipping' && <ShippingReturns goHome={nav.goHome} />}
        {route.name !== 'admin' && <ThreeShops />}
        {route.name !== 'admin' && <Newsletter />}
        <Footer goShop={nav.goShop} goAbout={nav.goAbout} goContact={nav.goContact} />
        {cartOpen && <CartDrawer close={() => setCartOpen(false)} goCheckout={nav.goCheckout} />}
        {editingProduct && <ProductEditModal product={editingProduct} onSaved={handleProductSaved} onClose={() => setEditingProduct(null)} />}
      </div>
    </CartProvider>
  );
}
