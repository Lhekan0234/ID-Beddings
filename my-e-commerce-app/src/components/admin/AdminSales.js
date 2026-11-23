import { useEffect, useState } from 'react';
import {
  adminSalesCsvUrl,
  getAdminSales,
} from '../../api/client';
import { formatPrice } from '../../utils/format';
import Button from '../ui/Button';

const EMPTY_FILTERS = {
  q: '',
  from: '',
  to: '',
  paymentMethod: '',
  paymentStatus: '',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-NG');
};

/** Searchable, filterable sales records with a server-generated CSV export. */
export default function AdminSales() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    getAdminSales(applied)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [applied]);

  const update = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }));
  };

  const apply = (event) => {
    event.preventDefault();
    setApplied({ ...filters });
  };

  return (
    <div className="admin-card">
      <h2>Sales</h2>
      <p className="admin-form__note">
        Every figure is derived from payment records. The CSV export escapes
        cells and neutralises spreadsheet formulas.
      </p>

      <form className="admin-filters" onSubmit={apply}>
        <label>
          Search reference or email
          <input value={filters.q} onChange={update('q')} placeholder="IDB-… or email" />
        </label>
        <label>
          From
          <input type="date" value={filters.from} onChange={update('from')} />
        </label>
        <label>
          To
          <input type="date" value={filters.to} onChange={update('to')} />
        </label>
        <label>
          Payment method
          <select value={filters.paymentMethod} onChange={update('paymentMethod')}>
            <option value="">All methods</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="PAY_BY_BANK">Pay by bank</option>
          </select>
        </label>
        <label>
          Payment status
          <select value={filters.paymentStatus} onChange={update('paymentStatus')}>
            <option value="">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </label>
        <div className="admin-filters__actions">
          <Button type="submit">Apply filters</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
            }}
          >
            Clear
          </Button>
          <Button href={adminSalesCsvUrl(applied)} variant="secondary" download="idb-sales.csv">
            Export CSV
          </Button>
        </div>
      </form>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {!data && !error ? <p role="status">Loading sales…</p> : null}

      {data ? (
        <>
          <div className="stat-grid">
            <div className="stat">
              <p className="stat__label">Records in view</p>
              <p className="stat__value">{data.summary?.count ?? 0}</p>
            </div>
            <div className="stat">
              <p className="stat__label">Verified revenue in view</p>
              <p className="stat__value">{formatPrice(data.summary?.verifiedRevenue || 0)}</p>
            </div>
          </div>

          {Array.isArray(data.transactions) && data.transactions.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Payment reference</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => (
                    <tr key={tx.reference}>
                      <td>{tx.reference}</td>
                      <td>{tx.orderReference || '—'}</td>
                      <td>{tx.customerEmail || '—'}</td>
                      <td><span className="admin-badge">{tx.status}</span></td>
                      <td>{tx.method || '—'}</td>
                      <td>{formatPrice(tx.amount)}</td>
                      <td>{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No payment records match these filters.</p>
          )}
        </>
      ) : null}
    </div>
  );
}
