export function slugify(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function productSlug(product) {
  return `${product.id}-${slugify(product.name)}`;
}

export function categorySlug(cat) {
  return slugify(cat);
}

export function parseProductSlug(path) {
  const m = path.match(/^\/produit\/(.+)$/);
  if (!m) return null;
  const rest = decodeURIComponent(m[1]);
  const dashIdx = rest.indexOf('-');
  if (dashIdx > 0) {
    return rest.substring(0, dashIdx);
  }
  return rest;
}

export function parseCategorySlug(path) {
  const m = path.match(/^\/boutique\/(.+)$/);
  if (!m) return null;
  return decodeURIComponent(m[1]);
}

const ROUTES = {
  home: /^\/$/,
  shop: /^\/boutique(?:\/(.+))?$/,
  product: /^\/produit\/(.+)$/,
  about: /^\/a-propos$/,
  contact: /^\/nous-joindre$/,
  privacy: /^\/confidentialite$/,
  shipping: /^\/livraison-et-retours$/,
  wishlist: /^\/liste-de-souhaits$/,
  admin: /^\/admin$/,
  checkout: /^\/commande$/,
  confirmation: /^\/commande\/confirmation\/(.+)$/,
  search: /^\/recherche$/,
};

export function matchRoute(pathname) {
  const path = pathname || '/';
  for (const [name, regex] of Object.entries(ROUTES)) {
    const m = path.match(regex);
    if (m) return { name, param: m[1] ? decodeURIComponent(m[1]) : null };
  }
  return { name: 'home', param: null };
}

export function navigate(path, replace = false) {
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function redirectOldHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return;

  const map = [
    [/^#\/produit\/(.+)$/, (m) => `/produit/${decodeURIComponent(m[1])}`],
    [/^#\/boutique$/, () => '/boutique'],
    [/^#\/a-propos$/, () => '/a-propos'],
    [/^#\/liste$/, () => '/liste-de-souhaits'],
    [/^#\/admin$/, () => '/admin'],
    [/^#\/commande$/, () => '/commande'],
    [/^#\/commande\/confirmation\/(.+)$/, (m) => `/commande/confirmation/${decodeURIComponent(m[1])}`],
    [/^#\/recherche\?(.*)$/, (m) => `/recherche?${m[1]}`],
  ];

  for (const [regex, builder] of map) {
    const m = hash.match(regex);
    if (m) {
      const newPath = builder(m);
      history.replaceState(null, '', newPath);
      window.location.hash = '';
      break;
    }
  }
}
