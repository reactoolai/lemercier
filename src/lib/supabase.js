import { createClient } from '@supabase/supabase-js';
import { getSection } from '../data/categories.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

export async function fetchProducts(opts = {}) {
  const { page = 0, perPage = 24, section = null, category = null, brand = null, search = null, inStockOnly = false, priceMin = null, priceMax = null, sort = 'default' } = opts;
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (category && category !== 'Tout') {
    query = query.eq('cat', category);
  } else if (section && section !== 'Nouveautés' && section !== 'Soldes') {
    const { data: allCats } = await supabase.from('products').select('cat').not('cat', 'eq', '');
    const sectionCats = [...new Set((allCats || []).map(d => d.cat).filter(c => getSection(c) === section))];
    if (sectionCats.length === 0) return { products: [], total: 0 };
    query = query.in('cat', sectionCats);
  }

  if (brand) query = query.eq('brand', brand);
  if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,cat.ilike.%${search}%`);
  if (inStockOnly) query = query.gt('stock', 0);
  if (priceMin != null) query = query.gte('price', priceMin);
  if (priceMax != null) query = query.lte('price', priceMax);

  if (sort === 'price-asc') query = query.order('price', { ascending: true });
  else if (sort === 'price-desc') query = query.order('price', { ascending: false });
  else if (sort === 'stock') query = query.order('stock', { ascending: false });
  else query = query.order('id', { ascending: true });

  query = query.range(page * perPage, (page + 1) * perPage - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    products: (data || []).map(p => ({
      ...p,
      price: Number(p.price),
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
    })),
    total: count || 0,
  };
}

export async function fetchBrands(section = null) {
  const { data, error } = await supabase.from('products').select('brand').not('brand', 'eq', '');
  if (error) return [];
  let brands = [...new Set(data.map(d => d.brand))].filter(Boolean).sort();
  if (section && section !== 'Nouveautés' && section !== 'Soldes') {
    const { data: catData } = await supabase.from('products').select('cat,brand').not('cat', 'eq', '');
    const sectionBrands = new Set();
    for (const row of catData || []) {
      if (getSection(row.cat) === section && row.brand) sectionBrands.add(row.brand);
    }
    brands = [...sectionBrands].sort();
  }
  return brands;
}

export async function fetchCategories(section = null) {
  const { data, error } = await supabase.from('products').select('cat').not('cat', 'eq', '');
  if (error) return [];
  let cats = [...new Set(data.map(d => d.cat))].filter(Boolean).sort();
  if (section && section !== 'Nouveautés' && section !== 'Soldes') {
    cats = cats.filter(c => getSection(c) === section);
  }
  return cats;
}

export async function fetchProductById(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return { ...data, price: Number(data.price), sizes: Array.isArray(data.sizes) ? data.sizes : [], gallery: Array.isArray(data.gallery) ? data.gallery : [] };
}
