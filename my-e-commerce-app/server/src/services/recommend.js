import { priceMatchesBudget } from './pricing.js';

/**
 * Mattress recommendation matching (prd/agent.md section 7).
 *
 * Mirrors the storefront logic in src/utils/recommend.js, but runs against the
 * database catalogue. Only products whose data actually supports a match are
 * returned — we never guess a price, firmness or intended use.
 */

export const AUDIENCE_VALUES = ['adult', 'child', 'couple', 'guest-room'];
export const FIRMNESS_VALUES = ['Soft', 'Medium', 'Firm', 'Orthopedic'];

const normalise = (value) => String(value || '').trim().toLowerCase();

function productAudiences(product) {
  if (!Array.isArray(product.audiences)) return [];
  return product.audiences.map(normalise);
}

function productFirmness(product) {
  if (Array.isArray(product.firmness)) return product.firmness.map(normalise);
  if (product.firmness) return [normalise(product.firmness)];
  return [];
}

export function recommendProducts(products, { audience, firmness, budget } = {}) {
  if (!audience || !firmness || !budget) return [];

  const wantedAudience = normalise(audience);
  const wantedFirmness = normalise(firmness);

  return (products || [])
    .filter((product) => {
      if (!product || product.isArchived) return false;
      if (!productAudiences(product).includes(wantedAudience)) return false;
      if (!productFirmness(product).includes(wantedFirmness)) return false;
      return priceMatchesBudget(product.price, budget);
    })
    .sort((a, b) => Number(a.price) - Number(b.price));
}
