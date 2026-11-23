import { useEffect, useState } from 'react';
import {
  confirmDeliveryFee,
  getAdminOrders,
  updateOrderStatus,
} from '../../api/client';
import { formatPrice } from '../../utils/format';
import Button from '../ui/Button';

const NEXT_STATUSES = {
  ORDER_PLACED: [],
  PAYMENT_CONFIRMED: ['PROCESSING'],
  PROCESSING: ['DISPATCHED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const LABELS = {
  ORDER_PLACED: 'Order placed',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Review payment status and record manual fulfilment updates. */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [fee, setFee] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const data = await getAdminOrders();
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  };

  useEffect(() => {
    let active = true;
    load().catch((requestError) => {
      if (active) setError(requestError.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const choose = (order) => {
    setSelected(order);
    setStatus(NEXT_STATUSES[order.status]?.[0] || '');
    setNote('');
    setFee(order.deliveryFee === null || order.deliveryFee === undefined ? '' : String(order.deliveryFee));
    setError('');
    setNotice('');
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await updateOrderStatus(selected.reference, { status, note });
      setNotice('Status updated. The customer can see the recorded note when tracking.');
      await load();
      setSelected(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const submitFee = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await confirmDeliveryFee(selected.reference, Number(fee));
      setNotice('Delivery charge confirmed. Payment can now proceed.');
      await load();
      setSelected(await getAdminOrders().then((data) =>
        data.orders.find((order) => order.reference === selected.reference) || null
      ));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card">
      <h2>Orders</h2>
      <p className="admin-form__note">
        Payment confirmation is recorded only by the verified payment flow.
        Dispatch stages require a tracking note; no GPS tracking is claimed.
      </p>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {notice ? <p className="admin-form__note" role="status">{notice}</p> : null}

      {selected ? (
        <div className="admin-card">
          <h3>Order {selected.reference}</h3>
          <ul className="admin-detail-list">
            <li><span>Customer</span><span>{selected.customer?.email || '—'}</span></li>
            <li><span>Total</span><span>{formatPrice(selected.total)}</span></li>
            <li><span>Payment</span><span>{selected.paymentStatus}</span></li>
            <li><span>Fulfilment</span><span>{LABELS[selected.status] || selected.status}</span></li>
            <li><span>Delivery fee</span><span>{selected.deliveryFee === null ? 'Not confirmed' : formatPrice(selected.deliveryFee)}</span></li>
          </ul>

          <form className="admin-form" onSubmit={submitFee}>
            <label>
              Delivery charge (whole NGN)
              <input type="number" min="0" value={fee} onChange={(event) => setFee(event.target.value)} required />
            </label>
            <Button type="submit" variant="secondary" disabled={busy}>Confirm delivery charge</Button>
          </form>

          <form className="admin-form" onSubmit={submitStatus}>
            <label>
              New status
              <select value={status} onChange={(event) => setStatus(event.target.value)} required>
                <option value="">Choose the next step</option>
                {(NEXT_STATUSES[selected.status] || []).map((option) => (
                  <option key={option} value={option}>{LABELS[option]}</option>
                ))}
              </select>
            </label>
            <label>
              Tracking note (required for dispatch)
              <textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <div className="admin-filters__actions">
              <Button type="submit" disabled={busy || !status}>Update status</Button>
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </form>
        </div>
      ) : null}

      {orders.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Fulfilment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.reference}>
                  <td>{order.reference}</td>
                  <td>{order.customer?.email || '—'}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td><span className="admin-badge">{order.paymentStatus}</span></td>
                  <td>{LABELS[order.status] || order.status}</td>
                  <td><Button type="button" variant="secondary" onClick={() => choose(order)}>Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No orders have been placed yet.</p>
      )}
    </div>
  );
}
