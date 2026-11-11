// =============================================================================
// Mattress recommendation matching (prd/agent.md section 7)
// =============================================================================
// The recommendation form collects three answers (who it is for, preferred
// firmness and budget). These helpers translate those answers into a query
// against the real product catalogue.
//
// IMPORTANT: we only return products whose data actually supports a match.
// A product with no price, no firmness or no audience is never guessed at
// (prd/agent.md 2.7 "Do not invent products, prices..." and section 7
// "Return products matching ... where the necessary product data exists").
// =============================================================================

import { firmnessOptions } from '../data/products';

export const AUDIENCE_OPTIONS = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'couple', label: 'Couple' },
  { value: 'guest-room', label: 'Guest room' },
];

// Budget bands from prd/agent.md section 7. Each band is inclusive of its
// minimum and exclusive of its maximum, so a price of exactly ₦100,000 falls
// into "₦100–200k" and exactly ₦400,000 falls into "Premium".
export const BUDGET_OPTIONS = [
  { value: 'under-100k', label: 'Under ₦100k', min: 0, max: 100000 },
  { value: '100-200k', label: '₦100–200k', min: 100000, max: 200000 },
  { value: '200-400k', label: '₦200–400k', min: 200000, max: 400000 },
  { value: 'premium', label: 'Premium', min: 400000, max: Infinity },
];

const normalise = (value) => String(value || '').trim().toLowerCase();

export function getBudgetOption(value) {
  return BUDGET_OPTIONS.find((option) => option.value === value) || null;
}

export function isKnownPrice(price) {
  return price !== null && price !== undefined && price !== '' && !Number.isNaN(Number(price));
}

export function priceMatchesBudget(price, budgetValue) {
  const budget = getBudgetOption(budgetValue);
  if (!budget || !isKnownPrice(price)) return false;
  const amount = Number(price);
  return amount >= budget.min && amount < budget.max;
}

/**
 * Return products that match every provided answer.
 *
 * @param {Array} products catalogue products
 * @param {{audience?: string, firmness?: string, budget?: string}} answers
 * @returns {Array} matching products, cheapest first
 */
export function recommendProducts(products, { audience, firmness, budget } = {}) {
  if (!audience || !firmness || !budget) return [];

  const wantedFirmness = normalise(firmness);

  return (products || [])
    .filter((product) => {
      if (!product || product.isArchived) return false;

      // "Who is it for" — each product may serve several audiences.
      const audiences = Array.isArray(product.audiences)
        ? product.audiences.map(normalise)
        : [];
      if (!audiences.includes(normalise(audience))) return false;

      // Firmness may be stored as an array (per size) or a single value.
      const productFirmness = Array.isArray(product.firmness)
        ? product.firmness.map(normalise)
        : product.firmness
          ? [normalise(product.firmness)]
          : [];
      if (!productFirmness.includes(wantedFirmness)) return false;

      // Price must be known and inside the selected budget band.
      return priceMatchesBudget(product.price, budget);
    })
    .sort((a, b) => Number(a.price) - Number(b.price));
}

/** True when all three required answers are present and valid. */
export function isRecommendationComplete({ audience, firmness, budget } = {}) {
  return Boolean(
    AUDIENCE_OPTIONS.some((option) => option.value === audience) &&
      firmnessOptions.includes(firmness) &&
      getBudgetOption(budget)
  );
}
