import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hlzmzadbygyizbdzhvkb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsem16YWRieWd5aXpiZHpodmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTU5OTcsImV4cCI6MjEwMjIzMTk5N30.Nt778hNPi2xMzB7Ry20HSXQnduBN-tsBRXkBABFqVXk';
const SITE_URL = 'https://lemercieralma.com';
const DIST = 'dist';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

function absoluteUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SITE_URL + (path.startsWith('/') ? path : '/' + path);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildProductSEO(product) {
  const title = `${product.name} — ${product.brand || 'Le Mercier Alma'} | Le Mercier Alma`;
  const description = product.desc
    ? product.desc.substring(0, 155)
    : `${product.name}${product.brand ? ' de ' + product.brand : ''}${product.cat ? ' — ' + product.cat : ''}. Disponible à Le Mercier Alma, boutique de vêtements pour homme à Alma, Québec. Livraison 25 $, offerte dès 200 $.`;
  const slug = `${product.id}-${slugify(product.name)}`;
  const canonical = `${SITE_URL}/produit/${slug}`;
  const imgUrl = absoluteUrl(product.img);

  const metas = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="Le Mercier Alma">`,
    `<meta property="og:locale" content="fr_CA">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
  ];
  if (imgUrl) {
    metas.push(`<meta property="og:image" content="${imgUrl}">`);
    metas.push(`<meta property="og:image:width" content="1200">`);
    metas.push(`<meta property="og:image:height" content="1200">`);
  }
  if (product.price) {
    metas.push(`<meta property="product:price:amount" content="${product.price}">`);
    metas.push(`<meta property="product:price:currency" content="CAD">`);
  }
  metas.push(`<meta name="twitter:card" content="summary_large_image">`);
  metas.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  metas.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
  if (imgUrl) metas.push(`<meta name="twitter:image" content="${imgUrl}">`);

  const productJsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': description,
  };
  if (product.brand) productJsonld.brand = { '@type': 'Brand', 'name': product.brand };
  if (product.sku || product.id) { productJsonld.sku = product.sku || product.id; productJsonld.mpn = product.sku || product.id; }
  if (imgUrl) productJsonld.image = imgUrl;
  if (product.price) {
    productJsonld.offers = {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'CAD',
      'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': canonical,
      'seller': { '@type': 'Organization', 'name': 'Le Mercier Alma' },
    };
  }

  const breadcrumbJsonld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': SITE_URL + '/' },
      ...(product.cat ? [{ '@type': 'ListItem', 'position': 2, 'name': product.cat, 'item': `${SITE_URL}/boutique/${slugify(product.cat)}` }] : []),
      { '@type': 'ListItem', 'position': product.cat ? 3 : 2, 'name': product.name, 'item': canonical },
    ],
  };

  metas.push(`<script type="application/ld+json">${JSON.stringify(productJsonld)}</script>`);
  metas.push(`<script type="application/ld+json">${JSON.stringify(breadcrumbJsonld)}</script>`);

  return metas.join('\n  ');
}

function buildPageSEO(title, description, path) {
  const fullTitle = `${title} | Le Mercier Alma`;
  const canonical = `${SITE_URL}${path}`;
  return [
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Le Mercier Alma">`,
    `<meta property="og:locale" content="fr_CA">`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
  ].join('\n  ');
}

function writePage(dirPath, seoContent) {
  const indexPath = join(DIST, dirPath, 'index.html');
  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) { console.warn('dist/index.html not found, skipping prerender'); return; }
  let html = readFileSync(templatePath, 'utf-8');
  html = html.replace('<!--SEO-->', seoContent);
  mkdirSync(dirname(indexPath), { recursive: true });
  writeFileSync(indexPath, html);
  console.log('Wrote', indexPath);
}

async function main() {
  console.log('Fetching products from Supabase...');
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log(`Found ${products.length} products`);

  const sitemapUrls = [
    { loc: SITE_URL + '/', priority: '1.0' },
    { loc: SITE_URL + '/boutique', priority: '0.9' },
    { loc: SITE_URL + '/a-propos', priority: '0.5' },
    { loc: SITE_URL + '/nous-joindre', priority: '0.5' },
  ];

  const categories = new Set();
  for (const p of products) {
    if (p.cat) categories.add(p.cat);
    const slug = `${p.id}-${slugify(p.name)}`;
    const dirPath = `produit/${slug}`;
    try {
      writePage(dirPath, buildProductSEO(p));
    } catch (e) {
      console.error('Error writing product', p.id, e.message);
    }
    sitemapUrls.push({ loc: `${SITE_URL}/produit/${slug}`, priority: '0.8' });
  }

  for (const cat of categories) {
    const slug = slugify(cat);
    const dirPath = `boutique/${slug}`;
    const seo = buildPageSEO(cat, `Collection ${cat} — Le Mercier Alma. Vêtements pour homme à Alma, Québec.`, `/boutique/${slug}`);
    try {
      writePage(dirPath, seo);
    } catch (e) {
      console.error('Error writing category', cat, e.message);
    }
    sitemapUrls.push({ loc: `${SITE_URL}/boutique/${slug}`, priority: '0.7' });
  }

  writePage('a-propos', buildPageSEO('À propos', 'Le Mercier Alma — boutique de vêtements pour homme à Alma, Québec. Née à Saint-Georges de Beauce, la boutique offre marques sélectionnées, service personnalisé et ajustements sur mesure.', '/a-propos'));
  writePage('nous-joindre', buildPageSEO('Nous joindre', 'Contactez Le Mercier Alma — 630 Rue Sacré-Coeur O, Alma, Québec. Téléphone, courriel, heures d\'ouverture et réseaux sociaux.', '/nous-joindre'));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
  console.log('Wrote sitemap.xml');

  const robots = `User-agent: *
Disallow: /admin
Disallow: /commande

Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(join(DIST, 'robots.txt'), robots);
  console.log('Wrote robots.txt');

  console.log('Prerender complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
