import { useEffect, useState } from 'react';
import { getAdminCustomer, getAdminCustomers } from '../../api/client';
import { formatPrice } from '../../utils/format';
import Button from '../ui/Button';

/** Administrator-only customer search with server-held order history. */
export default function AdminCustomers() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminCustomers({ q: applied })
      .then((data) => {
        if (active) {
          setCustomers(Array.isArray(data?.customers) ? data.customers : []);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [applied]);

  const open = async (id) => {
    setError('');
    try {
      const data = await getAdminCustomer(id);
      setSelected(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="admin-card">
      <h2>Customers</h2>
      <p className="admin-form__note">
        Records come from the database. Hiding this section in the UI is not the
        access control: every request is verified as administrator on the server.
      </p>

      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(query.trim());
          setSelected(null);
        }}
      >
        <label>
          Search name, email or phone
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" />
        </label>
        <div className="admin-filters__actions"><Button type="submit">Search</Button></div>
      </form>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      {selected ? (
        <div className="admin-card">
          <h3>{selected.customer.fullName}</h3>
          <ul className="admin-detail-list">
            <li><span>Email</span><span>{selected.customer.email}</span></li>
            <li><span>Phone</span><span>{selected.customer.phone}</span></li>
            <li><span>Address</span><span>{selected.customer.address}</span></li>
            <li><span>City</span><span>{selected.customer.city}, {selected.customer.state}</span></li>
          </ul>
          <h3>Order history</h3>
          {selected.orders.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Reference</th><th>Total</th><th>Payment</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {selected.orders.map((order) => (
                    <tr key={order.reference}>
                      <td>{order.reference}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.tracking?.currentLabel || order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">This customer has no orders.</p>
          )}
          <Button type="button" variant="secondary" onClick={() => setSelected(null)}>Close</Button>
        </div>
      ) : null}

      {customers.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Action</th></tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.fullName}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.orderCount}</td>
                  <td><Button type="button" variant="secondary" onClick={() => open(customer.id)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No customer records match your search.</p>
      )}
    </div>
  );
}
