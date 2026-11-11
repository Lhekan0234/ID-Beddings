import {
  isRecommendationComplete,
  priceMatchesBudget,
  recommendProducts,
} from './recommend';

function product(overrides) {
  return {
    id: 'p1',
    name: 'Test mattress',
    collection: 'better-sleep',
    price: 150000,
    images: [],
    sizes: ['Queen'],
    firmness: ['Medium'],
    audiences: ['adult'],
    stockStatus: 'In stock',
    specs: {},
    ...overrides,
  };
}

describe('priceMatchesBudget', () => {
  it('places boundary prices in the upper band', () => {
    expect(priceMatchesBudget(99999, 'under-100k')).toBe(true);
    expect(priceMatchesBudget(100000, 'under-100k')).toBe(false);
    expect(priceMatchesBudget(100000, '100-200k')).toBe(true);
    expect(priceMatchesBudget(200000, '100-200k')).toBe(false);
    expect(priceMatchesBudget(200000, '200-400k')).toBe(true);
    expect(priceMatchesBudget(400000, 'premium')).toBe(true);
  });

  it('never matches when the price is unknown', () => {
    expect(priceMatchesBudget(null, 'under-100k')).toBe(false);
    expect(priceMatchesBudget(undefined, 'premium')).toBe(false);
    expect(priceMatchesBudget('', 'premium')).toBe(false);
  });
});

describe('recommendProducts', () => {
  const answers = { audience: 'adult', firmness: 'Medium', budget: '100-200k' };

  it('returns products matching audience, firmness and budget', () => {
    const match = product({ id: 'match' });
    const wrongAudience = product({ id: 'wrong-audience', audiences: ['child'] });
    const wrongFirmness = product({ id: 'wrong-firmness', firmness: ['Firm'] });
    const wrongBudget = product({ id: 'wrong-budget', price: 450000 });

    const results = recommendProducts(
      [match, wrongAudience, wrongFirmness, wrongBudget],
      answers
    );

    expect(results.map((p) => p.id)).toEqual(['match']);
  });

  it('is case-insensitive about firmness and audience', () => {
    const results = recommendProducts(
      [product({ id: 'match', firmness: ['medium'], audiences: ['ADULT'] })],
      answers
    );
    expect(results).toHaveLength(1);
  });

  it('supports a single firmness value instead of an array', () => {
    const results = recommendProducts(
      [product({ id: 'match', firmness: 'Medium' })],
      answers
    );
    expect(results).toHaveLength(1);
  });

  it('excludes products missing the necessary data', () => {
    const results = recommendProducts(
      [
        product({ id: 'no-price', price: null }),
        product({ id: 'no-firmness', firmness: [] }),
        product({ id: 'no-audience', audiences: [] }),
      ],
      answers
    );
    expect(results).toEqual([]);
  });

  it('returns results cheapest first', () => {
    const results = recommendProducts(
      [
        product({ id: 'expensive', price: 190000 }),
        product({ id: 'cheap', price: 120000 }),
      ],
      answers
    );
    expect(results.map((p) => p.id)).toEqual(['cheap', 'expensive']);
  });

  it('returns nothing until every question is answered', () => {
    expect(recommendProducts([product()], { audience: 'adult' })).toEqual([]);
    expect(recommendProducts([product()], {})).toEqual([]);
  });

  it('excludes archived products', () => {
    expect(
      recommendProducts([product({ isArchived: true })], answers)
    ).toEqual([]);
  });
});

describe('isRecommendationComplete', () => {
  it('accepts each valid combination', () => {
    expect(
      isRecommendationComplete({
        audience: 'guest-room',
        firmness: 'Orthopedic',
        budget: 'premium',
      })
    ).toBe(true);
  });

  it('rejects unknown answers', () => {
    expect(
      isRecommendationComplete({
        audience: 'alien',
        firmness: 'Squishy',
        budget: 'free',
      })
    ).toBe(false);
  });
});
