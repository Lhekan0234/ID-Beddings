import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  downloadReceipt,
  readLastOrder,
  rememberLastOrder,
  trackOrder,
} from '../api/client';
import { formatPrice } from '../utils/format';
import Button from '../components/ui/Button';
import WhatsAppHelp from '../components/contact/WhatsAppHelp';
import './TrackOrder.css';

const formatDate = (value) => {
  if (!value) return 'Not yet recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet recorded';
  return date.toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * Secure order tracking (prd/agent.md section 11, Phase 7).
 *
 * The reference alone is not enough: the checkout email is required and the
 * server returns the same generic not-found for a mismatched pair. Status text
 * comes from the administrator's recorded events; no GPS or delivery promise
 * is implied.
 */
export default function TrackOrder() {
  const [params] = useSearchParams();
  const stored = readLastOrder();
  const [reference, setReference] = useState(
    params.get('reference') || stored?.reference || ''
  );
  const [email, setEmail] = useState(stored?.email || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reference.trim() || !email.trim()) {
      setError('Enter both your order reference and the email used at checkout.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const data = await trackOrder(reference.trim(), email.trim());
      setOrder(data.order);
      rememberLastOrder({ reference: reference.trim(), email: email.trim() });
    } catch (requestError) {
      setOrder(null);
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceipt = async () => {
    if (!order) return;
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadReceipt({ reference: order.reference, email });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${order.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  };

  const tracking = order?.tracking;

  return (
    <div className="container page">
      <header className="page__header">
        <h1>Track your order</h1>
        <p className="text-muted">
          Enter your order reference and the email address you used at checkout.
        </p>
      </header>

      <div className="tracking-layout">
        <div className="tracking-main">
          <form className="tracking-form" onSubmit={handleSubmit}>
            <div className="checkout__field">
              <label htmlFor="track-reference">Order reference</label>
              <input
                id="track-reference"
                name="reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="IDB-YYYYMMDD-XXXXXX"
                autoComplete="off"
                required
              />
            </div>
            <div className="checkout__field">
              <label htmlFor="track-email">Email used at checkout</label>
              <input
                id="track-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Checking…' : 'Check order status'}
            </Button>
          </form>

          {error ? (
            <p className="tracking-error" role="alert">
              {error}
            </p>
          ) : null}

          {order ? (
            <section className="tracking-result" aria-live="polite">
              <div className="tracking-result__header">
                <div>
                  <h2>Order {order.reference}</h2>
                  <p className="tracking-result__status">{tracking.currentLabel}</p>
                </div>
                <p className="tracking-result__payment">
                  Payment: {order.paymentStatus === 'PAID' ? 'Verified' : 'Not confirmed'}
                </p>
              </div>

              <p className="tracking-disclaimer">{tracking.note}</p>

              <h3>Delivery progress</h3>
              <ol className="tracking-steps">
                {tracking.steps.map((step) => (
                  <li
                    key={step.status}
                    className={`tracking-step ${step.reached ? 'is-reached' : ''} ${
                      step.current ? 'is-current' : ''
                    }`}
                  >
                    <span className="tracking-step__marker" aria-hidden="true" />
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.description}</p>
                      <time>{formatDate(step.at)}</time>
                    </div>
                  </li>
                ))}
              </ol>

              {tracking.cancellation ? (
                <div className="tracking-cancelled" role="status">
                  <strong>{tracking.cancellation.label}</strong>
                  <p>{tracking.cancellation.description}</p>
                  <time>{formatDate(tracking.cancellation.at)}</time>
                </div>
              ) : null}

              {tracking.notes.length ? (
                <div className="tracking-notes">
                  <h3>Tracking notes</h3>
                  <ul>
                    {[...tracking.notes].reverse().map((note, index) => (
                      <li key={`${note.at}-${index}`}>
                        <strong>{note.label}</strong>
                        <p>{note.note}</p>
                        <time>{formatDate(note.at)}</time>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <h3>Items</h3>
              <ul className="tracking-items">
                {order.items.map((item) => (
                  <li key={`${item.productId}-${item.size || ''}`}>
                    <span>
                      {item.name}
                      {item.size ? ` (${item.size})` : ''} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="tracking-total">
                Order total: <strong>{formatPrice(order.total)}</strong>
              </p>

              {order.paymentStatus === 'PAID' ? (
                <Button type="button" onClick={handleReceipt} disabled={downloading}>
                  {downloading ? 'Preparing receipt…' : 'Download PDF receipt'}
                </Button>
              ) : (
                <p className="tracking-pending">
                  No receipt is available until payment has been verified.
                </p>
              )}
            </section>
          ) : null}
        </div>

        <aside className="tracking-aside">
          <WhatsAppHelp reference={order?.reference || reference} />
          <p className="tracking-aside__note">
            Already have an account? <Link to="/account">Sign in to see your order history</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}
