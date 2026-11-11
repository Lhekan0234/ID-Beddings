import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

/**
 * Scroll to the top of the page whenever the route path changes.
 * (Implemented manually because <ScrollRestoration> requires a data router,
 * while this app uses the component-based <BrowserRouter>.)
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** App shell: skip link, header, routed page content, footer. */
export default function Layout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="app-shell__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

