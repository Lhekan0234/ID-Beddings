import { Link } from 'react-router-dom';
import site from '../../config/site';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__col">
          <span className="site-footer__brand">{site.name}</span>
          <p className="site-footer__tagline">{site.tagline}</p>
        </div>

        <nav className="site-footer__col" aria-label="Footer">
          <h2 className="site-footer__heading">Shop</h2>
          <ul className="site-footer__list">
            <li><Link to="/collections">All collections</Link></li>
            <li><Link to="/contact">Contact &amp; support</Link></li>
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2 className="site-footer__heading">Chat with us</h2>
          <ul className="site-footer__list">
            <li>
              <a href={site.whatsapp.catalogue} target="_blank" rel="noopener noreferrer">
                Product catalogue on WhatsApp
              </a>
            </li>
            <li>
              <a href={site.whatsapp.specialist} target="_blank" rel="noopener noreferrer">
                Chat with a mattress specialist
              </a>
            </li>
          </ul>
          {/* prd/agent.md section 4: verify WhatsApp destinations before relying on them. */}
          {!site.whatsapp.verified && (
            <p className="site-footer__note">
              WhatsApp links pending verification by the business owner.
            </p>
          )}
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container">
          <p className="site-footer__copyright">
            © {year} {site.name}. All prices in Nigerian Naira (₦).
          </p>
        </div>
      </div>
    </footer>
  );
}
