import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { getCollectionBySlug } from '../data/products';
import ProductImage from '../components/ui/ProductImage';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import OrderSummary from '../components/cart/OrderSummary';
import './Cart.css';

/**
 * Shopping cart page (prd/agent.md section 8).
 * Supports updating quantities, removing items, an empty state and a basket
 * summary. Payment is intentionally not started here (Phase 6).
 */
export default function Cart() {
  const { items, itemCount, subtotal, hasUnknownPrices, updateQuantity, removeItem } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="container page">
        <header className="page__header">
          <h1>Your cart</h1>
        </header>
        <EmptyState
          title="Your cart is empty"
          message="Browse our collections and add a mattress to get started."
          action={<Button to="/collections">Shop collections</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page__header">
        <h1>Your cart</h1>
        <p className="text-muted">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart.
        </p>
      </header>

      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => {
            const collection = getCollectionBySlug(item.product.collection);
            const fieldId = `quantity-${item.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

            return (
              <li key={item.key} className="cart-item">
                <Link to={`/products/${item.product.id}`} className="cart-item__media">
                  <ProductImage product={item.product} />
                </Link>

                <div className="cart-item__body">
                  {collection ? (
                    <span className="cart-item__collection">{collection.name}</span>
                  ) : null}
                  <h2 className="cart-item__title">
                    <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                  </h2>
                  {item.size ? (
                    <p className="cart-item__size">Size: {item.size}</p>
                  ) : null}
                  <p className="cart-item__unit">{formatPrice(item.product.price)}</p>

                  <div className="cart-item__controls">
                    <label htmlFor={fieldId} className="cart-item__qty-label">
                      Quantity
                    </label>
                    <input
                      id={fieldId}
                      type="number"
                      min="1"
                      max="99"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item.productId, item.size, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => removeItem(item.productId, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="cart-item__total">
                  {item.lineTotal === null ? 'TBD' : formatPrice(item.lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="cart-summary">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            hasUnknownPrices={hasUnknownPrices}
          />
          <div className="cart-summary__actions">
            <Button to="/checkout" variant="primary" fullWidth>
              Proceed to checkout
            </Button>
            <Button to="/collections" variant="secondary" fullWidth>
              Continue shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
