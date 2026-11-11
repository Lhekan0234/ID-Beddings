import { useMemo, useState } from 'react';
import { products } from '../data/products';
import { queryProducts } from '../utils/format';
import SearchBar from '../components/catalogue/SearchBar';
import Filters from '../components/catalogue/Filters';
import SortSelect from '../components/catalogue/SortSelect';
import ProductList from '../components/catalogue/ProductList';
import './Catalog.css';

const emptyCriteria = { collection: '', firmness: '', size: '', inStockOnly: false, query: '' };

/** Full-catalogue page: search + filter + sort across all collections. */
export default function Catalog() {
  const [criteria, setCriteria] = useState({ ...emptyCriteria });
  const [sortBy, setSortBy] = useState('featured');

  const results = useMemo(() => queryProducts(products, criteria, sortBy), [criteria, sortBy]);

  return (
    <div className="container page">
      <header className="page__header">
        <h1>Shop all products</h1>
        <p className="text-muted">Search, filter and sort the full catalogue.</p>
      </header>

      <div className="catalogue-toolbar">
        <SearchBar value={criteria.query} onChange={(query) => setCriteria({ ...criteria, query })} />
        <div className="catalogue-toolbar__row">
          <Filters value={criteria} onChange={setCriteria} />
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      <p className="results-count" aria-live="polite">
        {results.length} {results.length === 1 ? 'product' : 'products'}
      </p>

      <ProductList
        products={results}
        emptyTitle="No products match your filters"
        emptyMessage="Try adjusting your search or filters. Real catalogue data will be added by the business owner."
      />
    </div>
  );
}
