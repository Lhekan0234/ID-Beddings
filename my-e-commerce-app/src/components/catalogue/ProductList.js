import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import ProductGrid from './ProductGrid';

/**
 * Renders a product list with loading, error and empty states.
 * props: { products, loading, error, emptyTitle, emptyMessage }
 */
export default function ProductList({
  products,
  loading = false,
  error = null,
  emptyTitle = 'No products found',
  emptyMessage,
}) {
  if (loading) {
    return <Spinner label="Loading products…" />;
  }

  if (error) {
    return (
      <div className="product-list__error" role="alert">
        {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return <ProductGrid products={products} />;
}
