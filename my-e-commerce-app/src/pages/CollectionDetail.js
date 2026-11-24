import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCollectionBySlug,
  getProductsByCollection,
} from '../data/products';
import { queryProducts } from '../utils/format';
import SearchBar from '../components/catalogue/SearchBar';
import Filters from '../components/catalogue/Filters';
import SortSelect from '../components/catalogue/SortSelect';
import ProductList from '../components/catalogue/ProductList';
import WhatsAppMoreInfo from '../components/contact/WhatsAppMoreInfo';
import './CollectionDetail.css';

const emptyCriteria = { collection: '', firmness: '', size: '', inStockOnly: false, query: '' };

export default function CollectionDetail() {
  const { collectionSlug } = useParams();
  const collection = getCollectionBySlug(collectionSlug);

  const [criteria, setCriteria] = useState({ ...emptyCriteria });
  const [sortBy, setSortBy] = useState('featured');

  const baseProducts = useMemo(
    () => (collection ? getProductsByCollection(collection.slug) : []),
    [collection]
  );

  const results = useMemo(
    // Within a collection page, the collection filter is implied by the route.
    () => queryProducts(baseProducts, { ...criteria, collection: '' }, sortBy),
    [baseProducts, criteria, sortBy]
  );

  const collectionIsEmpty = baseProducts.length === 0;

  if (!collection) {
    return (
      <div className="container page">
        <h1>Collection not found</h1>
        <p className="text-muted">We couldn't find that collection.</p>
        <Link to="/collections" className="btn btn--primary btn--md">Back to collections</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link to="/collections">Collections</Link> <span aria-hidden="true">/</span>{' '}
        <span aria-current="page">{collection.name}</span>
      </nav>

      <header className="page__header">
        <h1>{collection.name}</h1>
        <p className="text-muted">{collection.description}</p>
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
        emptyTitle={collectionIsEmpty
          ? 'More information available on WhatsApp'
          : 'No products match your filters'}
        emptyMessage={collectionIsEmpty
          ? undefined
          : 'Try adjusting your search or filters.'}
        emptyAction={collectionIsEmpty ? <WhatsAppMoreInfo /> : null}
      />
    </div>
  );
}
