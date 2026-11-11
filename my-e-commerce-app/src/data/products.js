// =============================================================================
// PLACEHOLDER PRODUCT CATALOGUE — ID Beddings and More
// =============================================================================
// prd/agent.md section 5: "Use real business-supplied product data. Mark
// missing data for the owner to provide." and section 2.7: "Do not invent
// products, prices, customer records or sales figures."
//
// Every entry below is a clearly-labelled PLACEHOLDER that exists only to
// exercise the storefront UI. The owner has NOT yet supplied real catalogue
// data, so we deliberately DO NOT invent:
//   - prices            -> null  (UI shows "Price TBD")
//   - specifications    -> {}    (empty)
//   - dimensions        -> (not present)
//   - available sizes   -> []    (empty)
//   - firmness          -> []    (empty)
//   - images            -> []    (empty -> local placeholder graphic, no hotlink)
//   - stock levels      -> 'TBD' (unknown, not a fabricated count)
//   - product claims    -> none  (no "best seller"/medical/quality claims)
//
// TODO(owner): Replace this file's contents with the real catalogue (the seven
// collections and their products, prices, sizes, firmness, specs and images).
// =============================================================================

// The seven collections required by prd/agent.md section 5.
export const collections = [
  { slug: 'budget-sleep', name: 'Budget Sleep', description: 'Affordable mattresses for everyday comfort.' },
  { slug: 'better-sleep', name: 'Better Sleep', description: 'A step up in support and durability.' },
  { slug: 'orthopedic-collection', name: 'Orthopedic Collection', description: 'Firmer options focused on support.' },
  { slug: 'luxury-sleep', name: 'Luxury Sleep', description: 'Premium materials and finish.' },
  { slug: 'hotel-collection', name: 'Hotel Collection', description: 'Hospitality-grade comfort.' },
  { slug: 'new-home-bundle', name: 'New Home Bundle', description: 'Bundles for setting up a new home.' },
  { slug: 'couples-bundle', name: 'Couples Bundle', description: 'Bundles sized for two.' },
];

// Distinct firmness / size values only drive the filter UI; they contain no
// invented per-product data. Sizes are left empty until the owner supplies them.
export const firmnessOptions = ['Soft', 'Medium', 'Firm', 'Orthopedic'];
export const sizeOptions = [];


// Placeholder products. One demo entry per collection so every collection page
// renders, plus an extra in Budget Sleep to demonstrate multiple results.
// NOTE: isBestSeller is false for all — we make no sales/popularity claims.
export const products = [
  {
    id: 'budget-sleep-sample-1',
    name: 'Budget Sleep Mattress (sample)',
    collection: 'budget-sleep',
    description: 'Placeholder listing for the Budget Sleep collection. Real description, price and specifications to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: true,
    dateAdded: '2026-01-05',
  },
  {
    id: 'budget-sleep-sample-2',
    name: 'Budget Sleep Pillowtop (sample)',
    collection: 'budget-sleep',
    description: 'Placeholder listing for the Budget Sleep collection. Real details to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: false,
    dateAdded: '2025-12-01',
  },
  {
    id: 'better-sleep-sample-1',
    name: 'Better Sleep Mattress (sample)',
    collection: 'better-sleep',
    description: 'Placeholder listing for the Better Sleep collection. Real details to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: true,
    dateAdded: '2026-01-08',
  },
  {
    id: 'orthopedic-collection-sample-1',
    name: 'Orthopedic Mattress (sample)',
    collection: 'orthopedic-collection',
    description: 'Placeholder listing for the Orthopedic Collection. Real details to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: false,
    dateAdded: '2025-11-20',
  },
  {
    id: 'luxury-sleep-sample-1',
    name: 'Luxury Sleep Mattress (sample)',
    collection: 'luxury-sleep',
    description: 'Placeholder listing for the Luxury Sleep collection. Real details to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: true,
    dateAdded: '2026-01-10',
  },
  {
    id: 'hotel-collection-sample-1',
    name: 'Hotel Collection Mattress (sample)',
    collection: 'hotel-collection',
    description: 'Placeholder listing for the Hotel Collection. Real details to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: false,
    dateAdded: '2025-10-15',
  },
  {
    id: 'new-home-bundle-sample-1',
    name: 'New Home Bundle (sample)',
    collection: 'new-home-bundle',
    description: 'Placeholder listing for the New Home Bundle. Real bundle contents and pricing to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: true,
    dateAdded: '2026-01-12',
  },
  {
    id: 'couples-bundle-sample-1',
    name: 'Couples Bundle (sample)',
    collection: 'couples-bundle',
    description: 'Placeholder listing for the Couples Bundle. Real bundle contents and pricing to be provided by the business owner.',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: false,
    dateAdded: '2025-09-30',
  },
];
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

// New arrivals = most recently added placeholder listings (by dateAdded).
// Best sellers are intentionally empty until the owner supplies real data,
// because we must not invent sales/popularity claims (prd/agent.md 2.7).
export function getNewArrivals(limit = 4) {
  return [...products]
    .filter((p) => p.isNewArrival)
    .sort((a, b) => Date.parse(b.dateAdded) - Date.parse(a.dateAdded))
    .slice(0, limit);
}

export function getBestSellers() {
  return products.filter((p) => p.isBestSeller);
}

export default products;
