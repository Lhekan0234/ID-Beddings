import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isKnownPrice,
  parseQuantity,
  priceMatchesBudget,
  priceOrder,
} from '../src/services/pricing.js';

function product(overrides = {}) {
  return {
    id: 'p1',
    name: 'Test mattress',
    price: 150000,
    sizes: ['Queen'],
    stockStatus: 'In stock',
    isArchived: false,
    ...overrides,
  };
}

describe('isKnownPrice', () => {
  it('accepts non-negative whole Naira amounts', () => {
    assert.equal(isKnownPrice(0), true);
    assert.equal(isKnownPrice(150000), true);
  });

  it('rejects missing, fractional, negative and string prices', () => {
    assert.equal(isKnownPrice(null), false);
    assert.equal(isKnownPrice(undefined), false);
    assert.equal(isKnownPrice(1.5), false);
    assert.equal(isKnownPrice(-1), false);
    assert.equal(isKnownPrice('150000'), false);
  });
});

describe('priceMatchesBudget', () => {
  it('uses inclusive minimum and exclusive maximum bands', () => {
    assert.equal(priceMatchesBudget(99999, 'under-100k'), true);
    assert.equal(priceMatchesBudget(100000, 'under-100k'), false);
    assert.equal(priceMatchesBudget(100000, '100-200k'), true);
    assert.equal(priceMatchesBudget(200000, '100-200k'), false);
    assert.equal(priceMatchesBudget(200000, '200-400k'), true);
    assert.equal(priceMatchesBudget(400000, 'premium'), true);
  });

  it('never matches an unknown price or an unknown band', () => {
    assert.equal(priceMatchesBudget(null, 'premium'), false);
    assert.equal(priceMatchesBudget(150000, 'free'), false);
  });
});

describe('parseQuantity', () => {
  it('accepts whole numbers from 1 to 99', () => {
    assert.equal(parseQuantity(1), 1);
    assert.equal(parseQuantity('3'), 3);
    assert.equal(parseQuantity(99), 99);
  });

  it('rejects zero, negatives, fractions, over-limit and text', () => {
    assert.equal(parseQuantity(0), null);
    assert.equal(parseQuantity(-2), null);
    assert.equal(parseQuantity(1.5), null);
    assert.equal(parseQuantity(100), null);
    assert.equal(parseQuantity('many'), null);
  });
});

describe('priceOrder', () => {
  it('recalculates line totals and subtotal from database prices', () => {
    const result = priceOrder([
      { product: product(), size: 'Queen', quantity: 2 },
      { product: product({ id: 'p2', name: 'Second', price: 50000 }), size: 'Queen', quantity: 1 },
    ]);

    assert.equal(result.items[0].lineTotal, 300000);
    assert.equal(result.items[1].lineTotal, 50000);
    assert.equal(result.subtotal, 350000);
  });

  it('flags a missing delivery fee instead of inventing one', () => {
    const result = priceOrder([{ product: product(), size: 'Queen', quantity: 1 }]);

    assert.equal(result.deliveryFee, null);
    assert.equal(result.total, 150000);
    assert.equal(result.requiresDeliveryQuote, true);
  });

  it('adds a configured delivery fee', () => {
    const result = priceOrder([{ product: product(), size: 'Queen', quantity: 1 }], {
      deliveryFee: 5000,
    });

    assert.equal(result.deliveryFee, 5000);
    assert.equal(result.total, 155000);
    assert.equal(result.requiresDeliveryQuote, false);
  });

  it('rejects a product with no confirmed price', () => {
    assert.throws(
      () => priceOrder([{ product: product({ price: null }), size: 'Queen', quantity: 1 }]),
      /confirmed price/i
    );
  });

  it('rejects archived and out-of-stock products', () => {
    assert.throws(
      () => priceOrder([{ product: product({ isArchived: true }), size: 'Queen', quantity: 1 }]),
      /no longer available/i
    );
    assert.throws(
      () =>
        priceOrder([
          { product: product({ stockStatus: 'Out of stock' }), size: 'Queen', quantity: 1 },
        ]),
      /out of stock/i
    );
  });

  it('requires a valid size when the product has sizes', () => {
    assert.throws(
      () => priceOrder([{ product: product(), size: '', quantity: 1 }]),
      /choose a size/i
    );
    assert.throws(
      () => priceOrder([{ product: product(), size: 'Super king', quantity: 1 }]),
      /not available/i
    );
  });

  it('rejects a size for a product that has no selectable sizes', () => {
    assert.throws(
      () => priceOrder([{ product: product({ sizes: [] }), size: 'Queen', quantity: 1 }]),
      /does not have selectable sizes/i
    );
  });

  it('rejects an empty order or an out-of-range quantity', () => {
    assert.throws(() => priceOrder([]), /empty/i);
    assert.throws(
      () => priceOrder([{ product: product(), size: 'Queen', quantity: 100 }]),
      /between 1 and 99/i
    );
  });
});
