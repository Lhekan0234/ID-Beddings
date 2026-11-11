import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import site from '../../config/site';
import './Header.css';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/collections', label: 'Collections' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

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
          </ul>
        </nav>
      </div>
    </header>
  );
}
