import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recommendProducts } from '../src/services/recommend.js';

function product(overrides = {}) {
  return {
    id: 'p1',
    name: 'Test mattress',
    price: 150000,
    firmness: ['Medium'],
    audiences: ['adult'],
    isArchived: false,
    ...overrides,
  };
}

const answers = { audience: 'adult', firmness: 'Medium', budget: '100-200k' };

describe('server recommendation matching', () => {
  it('returns only products that match audience, firmness and budget', () => {
    const results = recommendProducts(
      [
        product({ id: 'match' }),
        product({ id: 'wrong-audience', audiences: ['child'] }),
        product({ id: 'wrong-firmness', firmness: ['Firm'] }),
        product({ id: 'wrong-budget', price: 450000 }),
      ],
      answers
    );

    assert.deepEqual(results.map((p) => p.id), ['match']);
  });

  it('is case-insensitive about firmness and audience', () => {
    const results = recommendProducts(
      [product({ firmness: ['medium'], audiences: ['ADULT'] })],
      answers
    );
    assert.equal(results.length, 1);
  });

  it('supports a single firmness value', () => {
    assert.equal(recommendProducts([product({ firmness: 'Medium' })], answers).length, 1);
  });

  it('excludes products missing the necessary data', () => {
    const results = recommendProducts(
      [
        product({ price: null }),
        product({ firmness: [] }),
        product({ audiences: [] }),
      ],
      answers
    );
    assert.deepEqual(results, []);
  });

  it('excludes archived products', () => {
    assert.deepEqual(recommendProducts([product({ isArchived: true })], answers), []);
  });

  it('returns matches cheapest first', () => {
    const results = recommendProducts(
      [product({ id: 'expensive', price: 190000 }), product({ id: 'cheap', price: 120000 })],
      answers
    );
    assert.deepEqual(results.map((p) => p.id), ['cheap', 'expensive']);
  });

  it('returns nothing until every answer is supplied', () => {
    assert.deepEqual(recommendProducts([product()], { audience: 'adult' }), []);
    assert.deepEqual(recommendProducts([product()], {}), []);
  });
});
