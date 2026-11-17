import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import site from '../../config/site';
import { useCart } from '../../context/CartContext';
import './Header.css';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/collections', label: 'Collections' },
  { to: '/find-your-mattress', label: 'Find my mattress' },
  { to: '/track', label: 'Track order' },
  { to: '/account', label: 'Account' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand" onClick={closeMenu}>
          <span className="site-header__brand-name">{site.name}</span>
        </Link>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="site-header__toggle-bar" aria-hidden="true" />
          <span className="site-header__toggle-bar" aria-hidden="true" />
          <span className="site-header__toggle-bar" aria-hidden="true" />
        </button>

        <nav
          id="primary-navigation"
          className={`site-header__nav ${open ? 'is-open' : ''}`}
          aria-label="Primary"
        >
          <ul className="site-header__nav-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `site-header__nav-link ${isActive ? 'is-active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `site-header__nav-link site-header__cart ${isActive ? 'is-active' : ''}`
                }
                onClick={closeMenu}
                aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              >
                Cart
                <span className="site-header__cart-count" aria-hidden="true">
                  {itemCount}
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
