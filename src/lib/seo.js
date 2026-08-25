const SITE_NAME = 'Le Mercier Alma';
const SITE_URL = 'https://lemercieralma.com';

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

export function setProductSEO(product) {
  if (!product) return;

  const title = `${product.name} — ${product.brand || SITE_NAME} | ${SITE_NAME}`;
  const description = product.desc
    ? product.desc.substring(0, 155)
    : `${product.name}${product.brand ? ' de ' + product.brand : ''}${product.cat ? ' — ' + product.cat : ''}. Disponible à Le Mercier Alma, boutique de vêtements pour homme à Alma, Québec. Livraison 25 $, offerte dès 200 $.`;

  setDocumentTitle(title);
  setMetaTag('description', description);
  setMetaTag('og:title', title, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:type', 'product', 'property');
  if (product.img) setMetaTag('og:image', product.img, 'property');
  setMetaTag('twitter:title', title);
  setMetaTag('twitter:description', description);
  if (product.img) setMetaTag('twitter:image', product.img);

  const existing = document.getElementById('product-jsonld');
  if (existing) existing.remove();

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': description,
  };
  if (product.brand) {
    jsonld.brand = { '@type': 'Brand', 'name': product.brand };
  }
  if (product.sku || product.id) {
    jsonld.sku = product.sku || product.id;
    jsonld.mpn = product.sku || product.id;
  }
  if (product.img) {
    jsonld.image = product.img;
  }
  if (product.price) {
    jsonld.offers = {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'CAD',
      'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': SITE_URL,
      'seller': { '@type': 'Organization', 'name': SITE_NAME },
    };
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'product-jsonld';
  script.textContent = JSON.stringify(jsonld);
  document.head.appendChild(script);
}

export function setPageSEO(title, description) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Boutique de vêtements pour homme à Alma`;
  setDocumentTitle(fullTitle);
  if (description) setMetaTag('description', description);
  setMetaTag('og:title', fullTitle, 'property');
  setMetaTag('og:type', 'website', 'property');
  if (description) setMetaTag('og:description', description, 'property');

  const existing = document.getElementById('product-jsonld');
  if (existing) existing.remove();
}

export function resetSEO() {
  setDocumentTitle('Le Mercier Alma — Boutique de vêtements pour homme à Alma, Lac-Saint-Jean');
  setMetaTag('description', "Le Mercier Alma : boutique de vêtements pour homme à Alma, Québec. Chemises, costumes, polos, shorts et accessoires des marques NZA, Psycho Bunny, Au Noir et plus. Service personnalisé et ajustements sur mesure.");
  setMetaTag('og:title', 'Le Mercier Alma — Boutique de vêtements pour homme à Alma', 'property');
  setMetaTag('og:type', 'website', 'property');
  setMetaTag('og:description', "Chemises, costumes, polos et accessoires pour homme à Alma, Québec. Marques sélectionnées, service personnalisé et ajustements sur mesure.", 'property');

  const existing = document.getElementById('product-jsonld');
  if (existing) existing.remove();
}
