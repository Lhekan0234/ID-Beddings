import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { getProductById } from '../data/products';
import { isKnownPrice } from '../utils/recommend';

// Cart state is mirrored to localStorage so a customer does not lose their
// basket on refresh. This is ONLY a convenience cache for the shopping cart:
// prd/agent.md section 12 forbids localStorage as the database for customer
// records, orders or payments, and those live server-side from Phase 5.
const STORAGE_KEY = 'idb-cart-v1';
const MAX_QUANTITY = 99;

const CartContext = createContext(null);

export function cartLineKey(productId, size = '') {
  return `${productId}::${size || ''}`;
}

export function normaliseQuantity(quantity) {
  const value = Math.floor(Number(quantity));
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(MAX_QUANTITY, value);
}

/**
 * Read and validate the persisted cart. Anything malformed, unknown or from a
 * deleted product is dropped rather than breaking the page.
 */
export function readStoredCart(storage) {
  try {
    const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return [];
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (line) =>
          line &&
          typeof line.productId === 'string' &&
          getProductById(line.productId)
      )
      .map((line) => ({
        productId: line.productId,
        size: typeof line.size === 'string' ? line.size : '',
        quantity: normaliseQuantity(line.quantity),
      }));
  } catch {
    return [];
  }
}

function reducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const { productId, size = '', quantity } = action;
      const key = cartLineKey(productId, size);
      const existing = lines.find((line) => cartLineKey(line.productId, line.size) === key);

      if (existing) {
        return lines.map((line) =>
          cartLineKey(line.productId, line.size) === key
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
            : line
        );
      }

      return [...lines, { productId, size, quantity: normaliseQuantity(quantity) }];
    }

    case 'setQuantity': {
      const key = cartLineKey(action.productId, action.size);
      if (normaliseQuantity(action.quantity) === 1 && Number(action.quantity) < 1) {
        return lines.filter((line) => cartLineKey(line.productId, line.size) !== key);
      }
      return lines.map((line) =>
        cartLineKey(line.productId, line.size) === key
          ? { ...line, quantity: normaliseQuantity(action.quantity) }
          : line
      );
    }

    case 'remove': {
      const key = cartLineKey(action.productId, action.size);
      return lines.filter((line) => cartLineKey(line.productId, line.size) !== key);
    }

    case 'clear':
      return [];

    default:
      return lines;
  }
}

export function summariseCart(items = []) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + (item.lineTotal === null ? 0 : item.lineTotal),
    0
  );
  const hasUnknownPrices = items.some((item) => item.lineTotal === null);
  return { itemCount, subtotal, hasUnknownPrices };
}

export function CartProvider({ children }) {  const [lines, dispatch] = useReducer(reducer, undefined, () => readStoredCart());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be unavailable (private mode/quota). The in-memory cart
      // still works for this session.
    }
  }, [lines]);

  const addItem = useCallback((productId, { size = '', quantity = 1 } = {}) => {
    const product = getProductById(productId);
    if (!product) return { ok: false, reason: 'not-found' };
    if (product.stockStatus === 'Out of stock') {
      return { ok: false, reason: 'out-of-stock' };
    }
    dispatch({ type: 'add', productId, size, quantity: normaliseQuantity(quantity) });
    return { ok: true };
  }, []);

  const updateQuantity = useCallback((productId, size, quantity) => {
    if (quantity === '' || quantity === null || quantity === undefined) return;
    if (Number(quantity) < 1) {
      dispatch({ type: 'remove', productId, size });
      return;
    }
    dispatch({ type: 'setQuantity', productId, size, quantity: normaliseQuantity(quantity) });
  }, []);

  const removeItem = useCallback((productId, size = '') => {
    dispatch({ type: 'remove', productId, size });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo(() => {
    const items = lines
      .map((line) => {
        const product = getProductById(line.productId);
        if (!product) return null;
        return {
          ...line,
          key: cartLineKey(line.productId, line.size),
          product,
          lineTotal: isKnownPrice(product.price)
            ? Number(product.price) * line.quantity
            : null,
        };
      })
      .filter(Boolean);

    const { itemCount, subtotal, hasUnknownPrices } = summariseCart(items);

    return {
      items,
      itemCount,
      subtotal,
      hasUnknownPrices,      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [lines, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export { STORAGE_KEY as CART_STORAGE_KEY };
