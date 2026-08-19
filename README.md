# Le Mercier Alma — Boutique en ligne

Prototype e-commerce (React + Vite).

## Démarrer
```
npm install
npm run dev
```

## Build production
```
npm run build
```

## Notes
- Les photos produits sont référencées depuis lemerciersg.com — à héberger localement avant mise en production (`src/data/products.js`).
- Le panier et la liste de souhaits sont en mémoire (état React). Brancher un backend / WooCommerce / Shopify pour la vraie boutique.
- Taxes calculées : TPS 5 % + TVQ 9,975 %.