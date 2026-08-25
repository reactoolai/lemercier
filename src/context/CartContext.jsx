import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'lm_cart';
const TOKEN_KEY = 'lm_cart_token';
const FREE_SHIPPING_THRESHOLD = 200;
const SHIPPING_FLAT = 25;

function getOrCreateToken() {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = (crypto.randomUUID && crypto.randomUUID()) ||
      'lm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function lineKey(item) {
  return [item.product_id, item.color || '', item.size || ''].join('||');
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [cartToken] = useState(getOrCreateToken);
  const debounceRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const trackCart = useCallback((items, subtotal) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-cart`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            cart_token: getOrCreateToken(),
            items: items.map(it => ({
              product_id: it.product_id,
              name: it.name,
              brand: it.brand,
              image: it.image,
              color: it.color,
              size: it.size,
              price: it.price,
              quantity: it.quantity,
            })),
            subtotal,
          }),
        });
      } catch (e) {
        console.error('track-cart error:', e.message);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const subtotal = cart.reduce((a, it) => a + it.price * it.quantity, 0);
    trackCart(cart, subtotal);
  }, [cart, trackCart]);

  const add = useCallback((item) => {
    setCart(prev => {
      const key = lineKey(item);
      const existing = prev.find(it => lineKey(it) === key);
      if (existing) {
        return prev.map(it => it === existing ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const remove = useCallback((index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const setQty = useCallback((index, qty) => {
    setCart(prev => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      return prev.map((it, i) => i === index ? { ...it, quantity: qty } : it);
    });
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const count = cart.reduce((a, it) => a + it.quantity, 0);
  const subtotal = cart.reduce((a, it) => a + it.price * it.quantity, 0);

  const value = {
    cart, cartToken,
    add, remove, setQty, clear,
    count, subtotal,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    shippingFlat: SHIPPING_FLAT,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
