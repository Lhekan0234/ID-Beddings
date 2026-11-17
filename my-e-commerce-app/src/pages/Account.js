import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAuthUser,
  getMyCustomer,
  getMyOrders,
  logIn,
  logOut,
  registerAccount,
} from '../api/client';
import { formatPrice } from '../utils/format';
import Button from '../components/ui/Button';
import WhatsAppHelp from '../components/contact/WhatsAppHelp';
import './Account.css';

/**
 * Customer account (prd/agent.md sections 12 and 15, Phase 7).
 *
 * All details and order history come from the database through protected APIs.
 * No customer data is stored in localStorage; the session lives in an httpOnly
 * cookie set by the server.
 */
export default function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAccount = async () => {
    const [customerData, orderData] = await Promise.all([
      getMyCustomer(),
      getMyOrders(),
    ]);
    setProfile(customerData.customer);
    setOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getAuthUser();
        if (!active) return;
        setUser(data.user);
        await loadAccount();
      } catch {
        if (active) {
          setProfile(null);
          setOrders([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const data =
        mode === 'register'
          ? await registerAccount(form.name.trim(), form.email.trim(), form.password)
          : await logIn(form.email.trim(), form.password);
      setUser(data.user);
      setForm({ name: '', email: '', password: '' });
      await loadAccount();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logOut();
      setUser(null);
      setProfile(null);
      setOrders([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <h1>My account</h1>
        <p role="status">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page__header">
        <h1>My account</h1>
        <p className="text-muted">
          Your saved delivery details and orders are stored on the server, not in
          this browser.
        </p>
      </header>

      {!user ? (
        <div className="account-auth">
          <div className="account-tabs" role="tablist" aria-label="Account access">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Create account
            </button>
          </div>

          <form className="account-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <div className="checkout__field">
                <label htmlFor="account-name">Name (optional)</label>
                <input
                  id="account-name"
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                />
              </div>
            ) : null}
            <div className="checkout__field">
              <label htmlFor="account-email">Email address</label>
              <input
                id="account-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                required
              />
            </div>
            <div className="checkout__field">
              <label htmlFor="account-password">Password</label>
              <input
                id="account-password"
                type="password"
                value={form.password}
                onChange={update('password')}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 8 : 1}
                required
              />
            </div>
            {error ? (
              <p className="tracking-error" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'register'
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <p className="account-note">
            Orders you previously placed as a guest are linked to your account
            when you sign in with the same email address.
          </p>
        </div>
      ) : (
        <div className="account-content">
          <section className="account-card">
            <h2>Your details</h2>
            <p className="account-note">
              Signed in as {user.name || user.email}
            </p>
            {profile ? (
              <dl>
                <div><dt>Full name</dt><dd>{profile.fullName}</dd></div>
                <div><dt>Email</dt><dd>{profile.email}</dd></div>
                <div><dt>Phone</dt><dd>{profile.phone}</dd></div>
                <div><dt>Address</dt><dd>{profile.address}</dd></div>
                <div><dt>City</dt><dd>{profile.city}, {profile.state}</dd></div>
              </dl>
            ) : (
              <p className="account-note">
                You have no saved delivery details yet. They are saved with your
                first order.
              </p>
            )}
            <Button type="button" variant="secondary" onClick={handleLogout} disabled={busy}>
              Sign out
            </Button>
          </section>

          <section className="account-card">
            <h2>Order history</h2>
            {orders.length ? (
              <ul className="account-orders">
                {orders.map((order) => (
                  <li key={order.reference}>
                    <div>
                      <strong>{order.reference}</strong>
                      <p>
                        {order.tracking?.currentLabel || order.status} ·{' '}
                        {formatPrice(order.total)} ·{' '}
                        {order.paymentStatus === 'PAID'
                          ? 'Payment verified'
                          : 'Payment not confirmed'}
                      </p>
                    </div>
                    <Link to={`/track?reference=${encodeURIComponent(order.reference)}`}>
                      Track order
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="account-note">You have no orders yet.</p>
            )}
          </section>

          <WhatsAppHelp />
        </div>
      )}
    </div>
  );
}
