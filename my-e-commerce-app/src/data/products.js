// =============================================================================
// STOREFRONT CATALOGUE — ID Beddings and More
// =============================================================================
// Prices and product labels come from the owner's price list of 2026-11-24.
// The raw transcription lives in `ownerCatalogue.js` and is shared with the
// backend seed so the API and storefront cannot drift apart.
//
// What is still NOT supplied (and therefore not invented):
//   - stock levels -> 'TBD'
//   - firmness     -> only set where the owner's own wording supports it
//   - audiences    -> only set for the baby/kiddies ranges
//   - real photos  -> local SVGs clearly labelled "illustrative only"
//   - new-arrival / best-seller claims -> none
// =============================================================================

import { ownerLines, priceTiers, buildOwnerProducts } from './ownerCatalogue.mjs';
import { slugify } from '../utils/format';

// The seven collections required by prd/agent.md section 5. All are retained;
// New Home Bundle and Couples Bundle are intentionally empty because the owner
// did not supply any bundle products.
export const collections = [
  { slug: 'budget-sleep', name: 'Budget Sleep', description: 'Affordable mattresses for everyday comfort.' },
  { slug: 'better-sleep', name: 'Better Sleep', description: 'A step up in support and durability.' },
  { slug: 'orthopedic-collection', name: 'Orthopedic Collection', description: 'Firmer options focused on support.' },
  { slug: 'luxury-sleep', name: 'Luxury Sleep', description: 'Premium materials and finish.' },
  { slug: 'hotel-collection', name: 'Hotel Collection', description: 'Hospitality and institutional mattresses.' },
  { slug: 'new-home-bundle', name: 'New Home Bundle', description: 'Bundles for setting up a new home.' },
  { slug: 'couples-bundle', name: 'Couples Bundle', description: 'Bundles sized for two.' },
];

export { priceTiers };

// Firmness values are the fixed options from prd/agent.md section 7. Only the
// lines whose names explicitly say "Firm" carry a firmness value in the data.
export const firmnessOptions = ['Soft', 'Medium', 'Firm', 'Orthopedic'];

// Sizes are derived only from the owner's price list; no size is guessed.
export const sizeOptions = [...new Set(ownerLines.flatMap((line) => line.rows.map((row) => row[1])))]
  .filter((size) => !size.includes('...'))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

export const products = buildOwnerProducts(slugify);

// ---- Lookup helpers --------------------------------------------------------

export function getCollectionBySlug(slug) {
  return collections.find((c) => c.slug === slug) || null;
}

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

export function getProductsByCollection(slug) {
  return products.filter((p) => p.collection === slug);
}

/** The owner's own LUXURY / COMFORT / VALUE grouping. */
export function getProductsByTier(tier) {
  return products.filter((p) => p.specs?.tier === tier);
}

export function getProductLines() {
  return ownerLines.map((line) => ({
    line: line.line,
    tier: line.tier,
    collection: line.collection,
    variants: line.rows.length,
  }));
}

// No owner-supplied "new arrival" or popularity data exists, so both helpers
// stay honest rather than inventing recency or sales claims.
export function getNewArrivals() {
  return [];
}

export function getBestSellers() {
  return products.filter((p) => p.isBestSeller);
}

export default products;
