import { Link } from 'react-router-dom';
import site from '../config/site';
import { collections, getNewArrivals } from '../data/products';
import Button from '../components/ui/Button';
import ProductCard from '../components/catalogue/ProductCard';
import './Home.css';

export default function Home() {
  const newArrivals = getNewArrivals(4);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__eyebrow">{site.name}</p>
          <h1 className="hero__title">{site.tagline}</h1>
          <p className="hero__subtitle">
            Browse our mattress collections and find the right fit for every room and budget.
          </p>
          <div className="hero__actions">
            <Button to="/find-your-mattress" variant="accent" size="lg">
              Which mattress is right for me?
            </Button>
            <Button to="/collections" variant="primary" size="lg">Shop collections</Button>
            <Button href={site.whatsapp.specialist} variant="secondary" size="lg">
              View mattress catalogue
            </Button>
          </div>
        </div>
      </section>

      {/* Placeholder-data notice (prd/agent.md 2.7 / 5) */}
      {site.catalogueIsPlaceholder && (
        <div className="container">
          <div className="notice" role="note">
            <strong>Demo catalogue.</strong> Product listings shown are placeholders while the
            business owner supplies the real catalogue. Prices, specifications and images will
            appear here once provided.
          </div>
        </div>
      )}

      {/* Collections */}
      <section className="container section">
        <div className="section__header">
          <h2>Shop by collection</h2>
          <Link to="/collections" className="section__link">View all →</Link>
        </div>
        <ul className="collection-grid">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link to={`/collections/${c.slug}`} className="collection-tile">
                <span className="collection-tile__name">{c.name}</span>
                <span className="collection-tile__desc">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* New arrivals */}
      <section className="container section">
        <div className="section__header">
          <h2>New arrivals</h2>
        </div>
        {newArrivals.length > 0 ? (
          <ul className="product-grid" aria-label="New arrivals">
            {newArrivals.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">New arrivals will appear here once the catalogue is available.</p>
        )}
      </section>
    </div>
  );
}
