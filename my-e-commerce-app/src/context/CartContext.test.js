import { act, renderHook } from '@testing-library/react';
import {
  CART_STORAGE_KEY,
  CartProvider,
  readStoredCart,
  summariseCart,
  useCart,
} from './CartContext';

const PLACEHOLDER_ID = 'budget-sleep-sample-1';

function wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('readStoredCart', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(readStoredCart()).toEqual([]);
  });

  it('ignores malformed JSON', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{not json');
    expect(readStoredCart()).toEqual([]);
  });

  it('drops unknown products and clamps quantities', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { productId: 'does-not-exist', quantity: 1 },
        { productId: PLACEHOLDER_ID, quantity: 500, size: 'Queen' },
      ])
    );

    expect(readStoredCart()).toEqual([
      { productId: PLACEHOLDER_ID, size: 'Queen', quantity: 99 },
    ]);
  });
});

describe('summariseCart', () => {
  it('totals known prices and flags items without a price', () => {
    const items = [
      { quantity: 2, lineTotal: 5000 },
      { quantity: 1, lineTotal: null },
    ];

    expect(summariseCart(items)).toEqual({
      itemCount: 3,
      subtotal: 5000,
      hasUnknownPrices: true,
    });
  });

  it('handles an empty cart', () => {
    expect(summariseCart([])).toEqual({
      itemCount: 0,
      subtotal: 0,
      hasUnknownPrices: false,
    });
  });
});

describe('CartProvider', () => {
  it('adds an item and mirrors it to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { quantity: 2 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.hasUnknownPrices).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY))).toEqual([
      { productId: PLACEHOLDER_ID, size: '', quantity: 2 },
    ]);
  });

  it('merges quantities for the same product and size', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { quantity: 2 });
    });
    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { quantity: 3 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(5);
  });

  it('keeps different sizes as separate lines', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { size: 'Queen', quantity: 1 });
    });
    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { size: 'King', quantity: 1 });
    });

    expect(result.current.items).toHaveLength(2);
  });

  it('updates quantities and removes lines at zero', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { quantity: 2 });
    });
    act(() => {
      result.current.updateQuantity(PLACEHOLDER_ID, '', 4);
    });
    expect(result.current.itemCount).toBe(4);

    act(() => {
      result.current.updateQuantity(PLACEHOLDER_ID, '', 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('rejects unknown products', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let outcome;
    act(() => {
      outcome = result.current.addItem('not-a-product');
    });

    expect(outcome).toEqual({ ok: false, reason: 'not-found' });
    expect(result.current.items).toHaveLength(0);
  });

  it('rehydrates a saved cart on mount', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: PLACEHOLDER_ID, size: '', quantity: 3 }])
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.itemCount).toBe(3);
  });

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(PLACEHOLDER_ID, { quantity: 2 });
    });
    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY))).toEqual([]);
  });
});
