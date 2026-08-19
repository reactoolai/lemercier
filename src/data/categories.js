// Clean category-to-section mapping
// Database categories have been consolidated to these clean names

export const SECTIONS = {
  'Nouveautés': { label: 'Nouveautés', sort: 'new' },
  'Vêtements': { label: 'Vêtements', sort: 'cat' },
  'Accessoires': { label: 'Accessoires', sort: 'cat' },
  'Sous-vêtements': { label: 'Sous-vêtements', sort: 'cat' },
  'Chaussures': { label: 'Chaussures', sort: 'cat' },
  'Soldes': { label: 'Soldes', sort: 'sale' },
};

const CATEGORY_MAP = {
  // Vêtements
  'Chemises': 'Vêtements',
  'Polos': 'Vêtements',
  'Tricots & Cardigans': 'Vêtements',
  'Pantalons': 'Vêtements',
  'Shorts & Bermudas': 'Vêtements',
  'Vestes & Costumes': 'Vêtements',

  // Accessoires
  'Ceintures': 'Accessoires',
  'Cravates & Noeuds': 'Accessoires',
  'Accessoires': 'Accessoires',
  'Casquettes & Chapeaux': 'Accessoires',

  // Sous-vêtements
  'Boxers': 'Sous-vêtements',
  'Bodies': 'Sous-vêtements',
  'Tangas': 'Sous-vêtements',
  'Bas & Chaussettes': 'Sous-vêtements',

  // Chaussures
  'Chaussures': 'Chaussures',
};

export function getSection(rawCat) {
  if (!rawCat) return 'Vêtements';
  return CATEGORY_MAP[rawCat] || 'Vêtements';
}

export function getSectionCategories(allCategories) {
  const grouped = {};
  for (const cat of allCategories) {
    const section = getSection(cat);
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(cat);
  }
  return grouped;
}
