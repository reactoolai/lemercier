const SITE_NAME = 'Le Mercier Alma';
const SITE_URL = 'https://lemercieralma.com';

function absoluteUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SITE_URL + (path.startsWith('/') ? path : '/' + path);
}

export function setDocumentTitle(title) {
  document.title = title;
}

export function setMetaTag(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setLinkRel(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeDynamicJsonLd() {
  document.querySelectorAll('script[type="application/ld+json"].dynamic-jsonld').forEach(el => el.remove());
}

export function setProductSEO(product) {
  if (!product) return;

  const title = `${product.name} — ${product.brand || SITE_NAME} | ${SITE_NAME}`;
  const description = product.desc
    ? product.desc.substring(0, 155)
    : `${product.name}${product.brand ? ' de ' + product.brand : ''}${product.cat ? ' — ' + product.cat : ''}. Disponible à Le Mercier Alma, boutique de vêtements pour homme à Alma, Québec. Livraison 25 $, offerte dès 200 $.`;
  const canonical = `${SITE_URL}/produit/${product.id}-${(slugifyStr(product.name))}`;
  const imgUrl = absoluteUrl(product.img);

  setDocumentTitle(title);
  setLinkRel('canonical', canonical);
  setMetaTag('description', description);

  setMetaTag('og:type', 'product', 'property');
  setMetaTag('og:site_name', SITE_NAME, 'property');
  setMetaTag('og:locale', 'fr_CA', 'property');
  setMetaTag('og:title', title, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:url', canonical, 'property');
  if (imgUrl) {
    setMetaTag('og:image', imgUrl, 'property');
    setMetaTag('og:image:width', '1200', 'property');
    setMetaTag('og:image:height', '1200', 'property');
  }
  if (product.price) {
    setMetaTag('product:price:amount', String(product.price), 'property');
    setMetaTag('product:price:currency', 'CAD', 'property');
  }

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
  if (imgUrl) setMetaTag('twitter:image', imgUrl);

  removeDynamicJsonLd();

  const productJsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': description,
  };
  if (product.brand) {
    productJsonld.brand = { '@type': 'Brand', 'name': product.brand };
  }
  if (product.sku || product.id) {
    productJsonld.sku = product.sku || product.id;
    productJsonld.mpn = product.sku || product.id;
  }
  if (imgUrl) {
    productJsonld.image = imgUrl;
  }
  if (product.price) {
    productJsonld.offers = {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'CAD',
      'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': canonical,
      'seller': { '@type': 'Organization', 'name': SITE_NAME },
    };
  }

  const script1 = document.createElement('script');
  script1.type = 'application/ld+json';
  script1.className = 'dynamic-jsonld';
  script1.textContent = JSON.stringify(productJsonld);
  document.head.appendChild(script1);

  if (product.cat) {
    const breadcrumbJsonld = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': SITE_URL + '/' },
        { '@type': 'ListItem', 'position': 2, 'name': product.cat, 'item': `${SITE_URL}/boutique/${slugifyStr(product.cat)}` },
        { '@type': 'ListItem', 'position': 3, 'name': product.name, 'item': canonical },
      ],
    };
    const script2 = document.createElement('script');
    script2.type = 'application/ld+json';
    script2.className = 'dynamic-jsonld';
    script2.textContent = JSON.stringify(breadcrumbJsonld);
    document.head.appendChild(script2);
  }
}

export function setPageSEO(title, description, path) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Boutique de vêtements pour homme à Alma`;
  setDocumentTitle(fullTitle);
  if (description) setMetaTag('description', description);
  setMetaTag('og:title', fullTitle, 'property');
  setMetaTag('og:type', 'website', 'property');
  setMetaTag('og:site_name', SITE_NAME, 'property');
  setMetaTag('og:locale', 'fr_CA', 'property');
  if (description) setMetaTag('og:description', description, 'property');
  if (path) {
    const url = SITE_URL + path;
    setLinkRel('canonical', url);
    setMetaTag('og:url', url, 'property');
  }
  removeDynamicJsonLd();
}

export function resetSEO() {
  setDocumentTitle('Le Mercier Alma — Boutique de vêtements pour homme à Alma, Lac-Saint-Jean');
  setMetaTag('description', "Le Mercier Alma : boutique de vêtements pour homme à Alma, Québec. Chemises, costumes, polos, shorts et accessoires des marques NZA, Psycho Bunny, Au Noir et plus. Service personnalisé et ajustements sur mesure.");
  setLinkRel('canonical', SITE_URL + '/');
  setMetaTag('og:title', 'Le Mercier Alma — Boutique de vêtements pour homme à Alma', 'property');
  setMetaTag('og:type', 'website', 'property');
  setMetaTag('og:site_name', SITE_NAME, 'property');
  setMetaTag('og:locale', 'fr_CA', 'property');
  setMetaTag('og:description', "Chemises, costumes, polos et accessoires pour homme à Alma, Québec. Marques sélectionnées, service personnalisé et ajustements sur mesure.", 'property');
  setMetaTag('og:url', SITE_URL + '/', 'property');
  setMetaTag('og:image', SITE_URL + '/hero_here.jpg', 'property');
  removeDynamicJsonLd();
}

function slugifyStr(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
