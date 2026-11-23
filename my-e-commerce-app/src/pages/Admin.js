import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAuthUser, logOut } from '../api/client';
import Button from '../components/ui/Button';
import AdminOverview from '../components/admin/AdminOverview';
import AdminSales from '../components/admin/AdminSales';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCustomers from '../components/admin/AdminCustomers';
import AdminSettings from '../components/admin/AdminSettings';
import './Admin.css';

/**
 * Protected admin dashboard (prd/agent.md section 13, Phase 8).
 *
 * Hiding this route is NOT the security boundary: every endpoint it calls is
 * protected on the server with authenticate + requireAdmin. This page only
 * saves an authorised owner the trouble of signing in twice.
 */
const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Settings' },
];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('section') || 'overview';
  const section = SECTIONS.some((item) => item.id === requested) ? requested : 'overview';

  const [state, setState] = useState('loading');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAuthUser();
        if (!active) return;
        if (data.user?.role !== 'ADMIN') {
          setState('forbidden');
          return;
        }
        setUser(data.user);
        setState('ready');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message);
        setState(requestError.status === 401 ? 'signed-out' : 'forbidden');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectSection = (id) => setParams({ section: id });

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setState('signed-out');
  };

  if (state === 'loading') {
    return (
      <div className="container page">
        <h1>Admin dashboard</h1>
        <p role="status">Checking your access…</p>
      </div>
    );
  }

  if (state !== 'ready') {
    return (
      <div className="container page">
        <h1>Admin dashboard</h1>
        <div className="admin-gate" role="alert">
          <p>
            {state === 'signed-out'
              ? 'Sign in with an administrator account to open the dashboard.'
              : 'This area is restricted to authorised administrators.'}
          </p>
          {error ? <p className="admin-gate__error">{error}</p> : null}
          <Button to="/account">Go to account</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">ID Beddings and More</p>
          <h1>Admin dashboard</h1>
          <p className="text-muted">
            Signed in as {user.name || user.email}. Figures come only from real
            records; no sales or customers are invented.
          </p>
        </div>
        <div className="admin-header__actions">
          <Button to="/" variant="secondary">View storefront</Button>
          <Button type="button" variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </header>

      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin sections">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? 'is-active' : ''}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => selectSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="admin-content" aria-live="polite">
          {section === 'overview' ? <AdminOverview /> : null}
          {section === 'sales' ? <AdminSales /> : null}
          {section === 'products' ? <AdminProducts /> : null}
          {section === 'orders' ? <AdminOrders /> : null}
          {section === 'customers' ? <AdminCustomers /> : null}
          {section === 'settings' ? <AdminSettings /> : null}
        </main>
      </div>

      <p className="admin-footnote">
        Looking for a customer view? <Link to="/account">Open your account</Link> or{' '}
        <Link to="/track">track an order</Link>.
      </p>
    </div>
  );
}
