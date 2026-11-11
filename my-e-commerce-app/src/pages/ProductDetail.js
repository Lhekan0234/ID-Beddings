import { useParams, Link } from 'react-router-dom';
import { getProductById, getCollectionBySlug } from '../data/products';
import { formatPrice } from '../utils/format';
import ProductImage from '../components/ui/ProductImage';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import site from '../config/site';
import './ProductDetail.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const product = getProductById(productId);

  if (!product) {
    return (
      <div className="container page">
        <h1>Product not found</h1>
        <p className="text-muted">We couldn't find the product you're looking for.</p>
        <Link to="/collections" className="btn btn--primary btn--md">Browse collections</Link>
      </div>
    );
  }

  const collection = getCollectionBySlug(product.collection);
  const specs = product.specs && Object.keys(product.specs).length > 0 ? product.specs : null;

  return (
    <div className="container page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link to="/collections">Collections</Link>{' '}
        {collection ? (
          <>
            <span aria-hidden="true">/</span> <Link to={`/collections/${collection.slug}`}>{collection.name}</Link>{' '}
          </>
        ) : null}
        <span aria-hidden="true">/</span> <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail__media">
          <ProductImage product={product} />
        </div>

        <div className="product-detail__info">
          {collection ? <p className="product-detail__collection">{collection.name}</p> : null}
          <h1 className="product-detail__title">{product.name}</h1>

          <div className="product-detail__badges">
            {product.isPlaceholder && <Badge tone="warning">Sample listing</Badge>}
            {product.stockStatus === 'In stock' && <Badge tone="success">In stock</Badge>}
            {product.stockStatus === 'TBD' && <Badge tone="neutral">Stock status: to be confirmed</Badge>}
          </div>

          <p className="product-detail__price">{formatPrice(product.price)}</p>

          <p className="product-detail__description">{product.description}</p>

          <dl className="product-detail__attrs">
            <div>
              <dt>Firmness</dt>
              <dd>{product.firmness && product.firmness.length ? product.firmness.join(', ') : 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>Available sizes</dt>
              <dd>{product.sizes && product.sizes.length ? product.sizes.join(', ') : 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>Stock status</dt>
              <dd>{product.stockStatus || 'To be confirmed'}</dd>
            </div>
          </dl>

          {specs ? (
            <div className="product-detail__specs">
              <h2>Specifications</h2>
              <dl>
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-muted product-detail__specs-note">
              Detailed specifications will be published once provided by the business owner.
            </p>
          )}

          <div className="product-detail__actions">
            <Button href={site.whatsapp.specialist} variant="primary">
              Ask about this product
            </Button>
            <Button to="/collections" variant="secondary">
              Back to collections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
