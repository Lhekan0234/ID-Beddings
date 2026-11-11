import site from '../../config/site';
import { formatPrice } from '../../utils/format';
import './OrderSummary.css';

/**
 * Read-only basket summary shared by the cart and checkout pages.
 * Totals are shown for convenience only — prd/agent.md section 8 requires the
 * server to recalculate prices and totals before payment.
 */
export default function OrderSummary({ items, subtotal, hasUnknownPrices }) {
  const deliveryFee = site.delivery.fee;
  const deliveryIsKnown = deliveryFee !== null && deliveryFee !== undefined;

  return (
    <aside className="order-summary" aria-labelledby="order-summary-heading">
      <h2 id="order-summary-heading">Order summary</h2>

      <ul className="order-summary__items">
        {items.map((item) => (
          <li key={item.key} className="order-summary__item">
            <span className="order-summary__item-name">
              {item.product.name}
              {item.size ? ` — ${item.size}` : ''}
              <span className="order-summary__qty"> × {item.quantity}</span>
            </span>
            <span className="order-summary__item-total">
              {item.lineTotal === null ? 'TBD' : formatPrice(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="order-summary__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>
            {hasUnknownPrices && subtotal === 0 ? 'TBD' : formatPrice(subtotal)}
          </dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{deliveryIsKnown ? formatPrice(deliveryFee) : 'To be confirmed'}</dd>
        </div>
        <div className="order-summary__grand-total">
          <dt>Total</dt>
          <dd>
            {hasUnknownPrices
              ? 'TBD'
              : formatPrice(subtotal + (deliveryIsKnown ? Number(deliveryFee) : 0))}
          </dd>
        </div>
      </dl>

      {hasUnknownPrices ? (
        <p className="order-summary__note" role="note">
          Some items do not have a confirmed price yet, so the total cannot be
          calculated. Prices will be confirmed before any payment is taken.
        </p>
      ) : null}

      <p className="order-summary__note" role="note">
        {deliveryIsKnown
          ? site.delivery.note
          : `Delivery charges to be confirmed. ${site.delivery.note}`}{' '}
        Final prices, stock and totals are verified on the server before payment.
      </p>
    </aside>
  );
}
