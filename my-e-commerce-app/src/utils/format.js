import site from '../config/site';

/**
 * Format a numeric price in Nigerian Naira.
 * Returns "Price TBD" when the price is unknown (placeholder catalogue),
 * so we never display an invented price (prd/agent.md section 5).
 */
export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return 'Price TBD';
  }
  const value = Number(price);
  // Group thousands; NGN has no minor unit shown for whole prices.
  const formatted = value.toLocaleString('en-NG', {
    maximumFractionDigits: 0,
  });
  return `${site.currencySymbol}${formatted}`;
}

/** Turn arbitrary text into a URL-safe slug. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Filter a list of products by the provided criteria.
 * Empty/undefined criteria are ignored (i.e. "All").
 */
export function filterProducts(products, { collection, firmness, size, inStockOnly, query } = {}) {
  const q = (query || '').trim().toLowerCase();

  return products.filter((product) => {
    if (collection && product.collection !== collection) return false;

    if (firmness && !(product.firmness || []).includes(firmness)) return false;

    if (size && !(product.sizes || []).includes(size)) return false;

    if (inStockOnly && product.stockStatus !== 'In stock') return false;

    if (q) {
      const haystack = [
        product.name,
        product.description,
        product.collection,
        ...(product.firmness || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Sort a list of products.
 * sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest'
 * Products with an unknown price are always ordered last for price sorts,
 * so a placeholder never appears to be the cheapest/most expensive.
 */
export function sortProducts(products, sortBy = 'featured') {
  const list = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sortByPrice(list, false);
    case 'price-desc':
      return sortByPrice(list, true);
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
      return list.sort(
        (a, b) => (b.dateAdded ? Date.parse(b.dateAdded) : 0) - (a.dateAdded ? Date.parse(a.dateAdded) : 0)
      );
    case 'featured':
    default:
      return list;
  }
}

// Sort by numeric price; products with an unknown price (null/NaN) always come
// last, regardless of direction, so a placeholder is never treated as the
// cheapest or the most expensive.
function sortByPrice(list, descending) {
  const known = list.filter((p) => hasKnownPrice(p));
  const unknown = list.filter((p) => !hasKnownPrice(p));
  known.sort((a, b) =>
    descending ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price)
  );
  return [...known, ...unknown];
}

function hasKnownPrice(product) {
  const p = product.price;
  return p !== null && p !== undefined && !Number.isNaN(Number(p));
}

/** Combine search + filter + sort in one call. */
export function queryProducts(products, criteria = {}, sortBy = 'featured') {
  return sortProducts(filterProducts(products, criteria), sortBy);
}
