import { Link } from 'react-router-dom';
import { collections, getProductsByCollection } from '../data/products';
import './Collections.css';

export default function Collections() {
  return (
    <div className="container page">
      <header className="page__header">
        <h1>Collections</h1>
        <p className="text-muted">
          Explore our seven mattress and bedding collections.
        </p>
      </header>

      <ul className="collections-list">
        {collections.map((c) => {
          const count = getProductsByCollection(c.slug).length;
          return (
            <li key={c.slug} className="collections-list__item">
              <Link to={`/collections/${c.slug}`} className="collections-list__link">
                <div>
                  <h2 className="collections-list__name">{c.name}</h2>
                  <p className="collections-list__desc">{c.description}</p>
                </div>
                <span className="collections-list__count">
                  {count} {count === 1 ? 'product' : 'products'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
