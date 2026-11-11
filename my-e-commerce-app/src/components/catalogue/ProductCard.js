import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';
import { getCollectionBySlug } from '../../data/products';
import ProductImage from '../ui/ProductImage';
import Badge from '../ui/Badge';
import './ProductCard.css';

/** A single product summary card used in grids across the storefront. */
export default function ProductCard({ product }) {
  const collection = getCollectionBySlug(product.collection);

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__media">
        <ProductImage product={product} />
      </Link>

      <div className="product-card__body">
        {collection ? (
          <span className="product-card__collection">{collection.name}</span>
        ) : null}

        <h3 className="product-card__title">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>

        <p className="product-card__price">{formatPrice(product.price)}</p>

        <div className="product-card__badges">
          {product.isPlaceholder && <Badge tone="warning">Sample listing</Badge>}
          {product.stockStatus === 'In stock' && <Badge tone="success">In stock</Badge>}
        </div>

        <Link to={`/products/${product.id}`} className="product-card__link">
          View details →
        </Link>
      </div>
    </article>
  );
}
