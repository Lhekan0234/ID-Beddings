import { formatPrice, slugify, filterProducts, sortProducts, queryProducts } from './format';

describe('formatPrice', () => {
  it('shows "Price TBD" when price is unknown (never invents a price)', () => {
    expect(formatPrice(null)).toBe('Price TBD');
    expect(formatPrice(undefined)).toBe('Price TBD');
  });

  it('formats a known NGN price with the naira symbol and thousands separators', () => {
    // 150000 -> "₦150,000" (grouping may vary by locale ICU; assert the symbol + digits)
    const out = formatPrice(150000);
    expect(out.startsWith('₦')).toBe(true);
    expect(out.replace(/\D/g, '')).toBe('150000');
  });
});

describe('slugify', () => {
  it('creates URL-safe slugs', () => {
    expect(slugify('Orthopedic Collection')).toBe('orthopedic-collection');
    expect(slugify('  Budget  Sleep  ')).toBe('budget-sleep');
  });
});

const sample = [
  { id: 'a', name: 'Alpha Mattress', collection: 'budget-sleep', firmness: ['Soft'], sizes: ['King'], stockStatus: 'In stock', price: 50000 },
  { id: 'b', name: 'Beta Mattress', collection: 'luxury-sleep', firmness: ['Firm'], sizes: ['Queen'], stockStatus: 'TBD', price: null },
  { id: 'c', name: 'Gamma Pillow', collection: 'budget-sleep', firmness: ['Medium'], sizes: ['King'], stockStatus: 'In stock', price: 20000 },
];

describe('filterProducts', () => {
  it('filters by collection', () => {
    expect(filterProducts(sample, { collection: 'budget-sleep' }).map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('filters by firmness', () => {
    expect(filterProducts(sample, { firmness: 'Firm' }).map((p) => p.id)).toEqual(['b']);
  });

  it('filters by in-stock only', () => {
    expect(filterProducts(sample, { inStockOnly: true }).map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('searches by name (case-insensitive)', () => {
    expect(filterProducts(sample, { query: 'gamma' }).map((p) => p.id)).toEqual(['c']);
  });

  it('returns all when no criteria given', () => {
    expect(filterProducts(sample, {})).toHaveLength(3);
  });
});

describe('sortProducts', () => {
  it('sorts price ascending with unknown prices last', () => {
    const out = sortProducts(sample, 'price-asc').map((p) => p.id);
    expect(out).toEqual(['c', 'a', 'b']); // b has null price -> last
  });

  it('sorts price descending with unknown prices last', () => {
    const out = sortProducts(sample, 'price-desc').map((p) => p.id);
    expect(out).toEqual(['a', 'c', 'b']);
  });

  it('sorts by name A-Z', () => {
    expect(sortProducts(sample, 'name-asc').map((p) => p.name)).toEqual([
      'Alpha Mattress',
      'Beta Mattress',
      'Gamma Pillow',
    ]);
  });
});

describe('queryProducts', () => {
  it('combines filter and sort', () => {
    const out = queryProducts(sample, { collection: 'budget-sleep' }, 'price-asc').map((p) => p.id);
    expect(out).toEqual(['c', 'a']);
  });
});
