import { ApiError } from '../middleware/errors.js';

/**
 * Server-side pricing (prd/agent.md section 8).
 *
 * Prices and totals are ALWAYS recalculated here from database records. The
 * browser's cart totals are treated as untrusted display data.
 *
 * Money is stored as whole Naira (integer) because the business prices in
 * whole Naira and floats introduce rounding errors.
 */

export const MAX_QUANTITY_PER_LINE = 99;

// Budget bands from prd/agent.md section 7. Inclusive minimum, exclusive
// maximum: exactly ₦100,000 belongs to "₦100–200k" and exactly ₦400,000 to
// "Premium".
export const BUDGET_BANDS = {
  'under-100k': { min: 0, max: 100000 },
  '100-200k': { min: 100000, max: 200000 },
  '200-400k': { min: 200000, max: 400000 },
  premium: { min: 400000, max: Infinity },
};

export const BUDGET_VALUES = Object.keys(BUDGET_BANDS);

/** A price is usable only when it is a non-negative whole Naira amount. */
export function isKnownPrice(price) {
  return typeof price === 'number' && Number.isInteger(price) && price >= 0;
}

export function priceMatchesBudget(price, budgetValue) {
  const band = BUDGET_BANDS[budgetValue];
  if (!band || !isKnownPrice(price)) return false;
  return price >= band.min && price < band.max;
}

/** Parse a quantity from untrusted input. Returns null when invalid. */
export function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity)) return null;
  if (quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) return null;
  return quantity;
}

/**
 * Validate and price the requested order lines from database products.
 *
 * @param {Array<{product: object, size?: string, quantity: number}>} requested
 * @param {{deliveryFee?: number|null}} options
 * @returns {{
 *   items: Array,
 *   subtotal: number,
 *   deliveryFee: number|null,
 *   total: number,
 *   requiresDeliveryQuote: boolean
 * }}
 */
export function priceOrder(requested, { deliveryFee = null } = {}) {
  if (!Array.isArray(requested) || requested.length === 0) {
    throw ApiError.badRequest('Your cart is empty.');
  }
  if (requested.length > 50) {
    throw ApiError.badRequest('An order cannot contain more than 50 different items.');
  }

  if (deliveryFee !== null && deliveryFee !== undefined) {
    if (!Number.isInteger(deliveryFee) || deliveryFee < 0) {
      throw new ApiError(500, 'The configured delivery fee is invalid.');
    }
  }

  const items = requested.map(({ product, size = '', quantity }) => {
    if (!product) {
      throw ApiError.badRequest('One of the products in your cart is no longer available.');
    }
    if (product.isArchived) {
      throw ApiError.badRequest(`${product.name} is no longer available.`);
    }
    if (product.stockStatus === 'Out of stock') {
      throw ApiError.badRequest(`${product.name} is currently out of stock.`);
    }
    if (!isKnownPrice(product.price)) {
      throw ApiError.badRequest(
        `${product.name} does not have a confirmed price yet. Please contact us to order it.`
      );
    }

    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) {
      throw ApiError.badRequest('Each quantity must be a whole number between 1 and 99.');
    }

    const availableSizes = Array.isArray(product.sizes) ? product.sizes : [];
    const chosenSize = typeof size === 'string' ? size.trim() : '';

    if (availableSizes.length > 0) {
      if (!chosenSize) {
        throw ApiError.badRequest(`Please choose a size for ${product.name}.`);
      }
      if (!availableSizes.includes(chosenSize)) {
        throw ApiError.badRequest(`The selected size is not available for ${product.name}.`);
      }
    } else if (chosenSize) {
      throw ApiError.badRequest(`${product.name} does not have selectable sizes.`);
    }

    return {
      productId: product.id,
      nameSnapshot: product.name,
      size: chosenSize || null,
      unitPrice: product.price,
      quantity: parsedQuantity,
      lineTotal: product.price * parsedQuantity,
    };
  });

  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const requiresDeliveryQuote = deliveryFee === null || deliveryFee === undefined;
  const total = subtotal + (requiresDeliveryQuote ? 0 : deliveryFee);

  return {
    items,
    subtotal,
    deliveryFee: requiresDeliveryQuote ? null : deliveryFee,
    total,
    requiresDeliveryQuote,
  };
}
