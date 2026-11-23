import { useEffect, useState } from 'react';
import { getAdminOverview } from '../../api/client';
import { formatPrice } from '../../utils/format';

const formatDate = (value) => {
  if (!value) return 'Not yet recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not yet recorded'
    : date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
};

/** All values are supplied by the server's protected overview endpoint. */
export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminOverview()
      .then((response) => {
        if (active) setData(response.overview);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!data) return <p role="status">Loading overview…</p>;

  return (
    <div className="admin-card">
      <h2>Overview</h2>
      <p className="admin-form__note">
        Revenue counts only payments verified by the payment provider. Pending
        and failed attempts are never reported as sales.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <p className="stat__label">Verified sales revenue</p>
          <p className="stat__value">{formatPrice(data.verifiedRevenue)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Verified payments</p>
          <p className="stat__value">{data.verifiedPayments}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Total orders</p>
          <p className="stat__value">{data.totalOrders}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Pending orders</p>
          <p className="stat__value">{data.pendingOrders}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Customer records</p>
          <p className="stat__value">{data.customerCount}</p>
        </div>
      </div>

      <h3>Recent verified transactions</h3>
      {Array.isArray(data.recentTransactions) && data.recentTransactions.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Paid at</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((tx) => (
                <tr key={tx.reference}>
                  <td>{tx.reference}</td>
                  <td>{tx.orderReference || '—'}</td>
                  <td>{tx.method || '—'}</td>
                  <td>{formatPrice(tx.amount)}</td>
                  <td>{formatDate(tx.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No verified payments have been recorded yet.</p>
      )}
    </div>
  );
}
