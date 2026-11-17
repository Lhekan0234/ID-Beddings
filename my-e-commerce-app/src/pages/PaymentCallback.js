import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  downloadReceipt,
  readLastOrder,
  verifyPayment,
} from '../api/client';
import { formatPrice } from '../utils/format';
import Button from '../components/ui/Button';
import './Checkout.css';

/**
 * Paystack redirect landing page (prd/agent.md section 9).
 *
 * A browser redirect is never accepted as proof of payment. This page sends the
 * transaction reference to our server, which asks Paystack for the status and
 * validates amount, currency and order association before showing success.
 */

const METHOD_LABELS = {
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  PAY_BY_BANK: 'Pay by bank',
};

const STATUS_MESSAGES = {
  pending:
    'The payment provider has not confirmed this payment yet. If you completed a bank transfer it may take a little longer. Keep your reference and check again later.',
  failed:
    'The payment provider reported that this payment did not succeed. No money has been confirmed for this order.',
  expired:
    'This payment attempt expired before it was completed. No money has been confirmed for this order.',
};

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref') || '';
  const [stored] = useState(() => readLastOrder());
  const [email, setEmail] = useState(stored?.email || '');
  const [phase, setPhase] = useState(
    reference ? (stored?.email ? 'verifying' : 'email') : 'missing'
  );
  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const started = useRef(false);
  const { clearCart } = useCart();

  const runVerification = useCallback(
    async (emailValue) => {
      if (!reference || !emailValue) return;

      setPhase('verifying');
      setError('');

      try {
        const data = await verifyPayment(reference, emailValue);
        setPayment(data.payment);
        setOrder(data.order);

        if (data.payment?.status === 'PAID') {
          clearCart();
          setPhase('paid');
        } else if (data.payment?.status === 'FAILED') {
          setPhase('failed');
        } else if (data.payment?.status === 'EXPIRED') {
          setPhase('expired');
        } else {
          setPhase('pending');
        }
      } catch (requestError) {
        setError(requestError.message);
        setPhase('error');
      }
    },
    [reference, clearCart]
  );

  useEffect(() => {
    if (started.current || !reference) return;
    if (!stored?.email) return;
    started.current = true;
    runVerification(stored.email);
  }, [reference, stored, runVerification]);

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter the email address used at checkout.');
      return;
    }
    runVerification(trimmed);
  };

  const handleDownload = async () => {
    if (!order || !email) return;

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

  return (
    <div className="container page checkout">
      <header className="page__header">
        <h1>Payment status</h1>
        <p className="text-muted">
          This page confirms your payment with the payment provider. Nothing is
          marked as paid based on the redirect alone.
        </p>
      </header>

      <section className="checkout__status" aria-live="polite">
        {phase === 'missing' ? (
          <>
            <h2>No payment reference</h2>
            <p>Open this page from the payment provider&apos;s redirect, or use your order reference to check an order.</p>
            <div className="checkout__actions">
              <Button to="/">Continue shopping</Button>
            </div>
          </>
        ) : null}

        {phase === 'verifying' ? (
          <>
            <h2>Confirming payment…</h2>
            <p role="status">
              We are asking the payment provider for the verified status of this
              transaction. Please keep this page open.
            </p>
          </>
        ) : null}

        {phase === 'paid' ? (
          <>
            <h2>Payment confirmed</h2>
            <p>The payment provider has verified this payment on our server.</p>
            <dl>
              <div><dt>Order reference</dt><dd>{order?.reference}</dd></div>
              <div><dt>Amount paid</dt><dd>{formatPrice(payment?.amount)}</dd></div>
              <div><dt>Payment method</dt><dd>{METHOD_LABELS[payment?.method] || payment?.channel || '—'}</dd></div>
              <div><dt>Transaction reference</dt><dd>{payment?.reference}</dd></div>
            </dl>
            {error ? <p className="checkout__error" role="alert">{error}</p> : null}
            <div className="checkout__actions">
              <Button
                type="button"
                onClick={handleDownload}
                disabled={downloading || !order}
              >
                {downloading ? 'Preparing receipt…' : 'Download PDF receipt'}
              </Button>
              <Button to="/" variant="secondary">Continue shopping</Button>
            </div>
          </>
        ) : null}

        {phase === 'pending' || phase === 'failed' || phase === 'expired' ? (
          <>
            <h2>Payment not confirmed</h2>
            <p>{STATUS_MESSAGES[phase]}</p>
            <dl>
              <div><dt>Payment reference</dt><dd>{payment?.reference || reference}</dd></div>
              <div><dt>Status</dt><dd>{payment?.status || phase.toUpperCase()}</dd></div>
              {order ? <div><dt>Order reference</dt><dd>{order.reference}</dd></div> : null}
            </dl>
            <div className="checkout__actions">
              <Button
                type="button"
                onClick={() => runVerification(email.trim())}
                disabled={!email.trim()}
              >
                Check again
              </Button>
              <Button to="/contact" variant="secondary">Contact us</Button>
            </div>
          </>
        ) : null}

        {phase === 'error' ? (
          <>
            <h2>We could not confirm this payment</h2>
            <p className="checkout__error" role="alert">{error}</p>
            <p>
              If you were charged, do not pay again. Keep your payment reference
              and contact us so we can check it.
            </p>
            <div className="checkout__actions">
              <Button
                type="button"
                onClick={() => runVerification(email.trim())}
                disabled={!email.trim()}
              >
                Try again
              </Button>
              <Button to="/contact" variant="secondary">Contact us</Button>
            </div>
          </>
        ) : null}

        {phase === 'email' || (phase === 'error' && !email) ? (
          <form onSubmit={handleEmailSubmit} className="checkout__field">
            <label htmlFor="payment-callback-email">
              Email address used at checkout
            </label>
            <input
              id="payment-callback-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="checkout__actions">
              <Button type="submit">Verify payment</Button>
              <Button to="/contact" variant="secondary">Contact us</Button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
