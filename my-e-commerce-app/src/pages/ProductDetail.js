import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById, getCollectionBySlug } from '../data/products';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ui/ProductImage';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import site from '../config/site';
import './ProductDetail.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const product = getProductById(productId);
  const { addItem } = useCart();

  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');

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
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const outOfStock = product.stockStatus === 'Out of stock';

  const handleAddToCart = () => {
    if (hasSizes && !size) {
      setFeedback('Please choose a size first.');
      return;
    }

    const result = addItem(product.id, {
      size: hasSizes ? size : '',
      quantity: Number(quantity),
    });

    if (result.ok) {
      setFeedback('Added to your cart.');
    } else if (result.reason === 'out-of-stock') {
      setFeedback('This product is currently out of stock.');
    } else {
      setFeedback('Sorry, this product could not be added to your cart.');
    }
  };

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
            {outOfStock && <Badge tone="neutral">Out of stock</Badge>}
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
              <dd>{hasSizes ? product.sizes.join(', ') : 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>Stock status</dt>
              <dd>{product.stockStatus || 'To be confirmed'}</dd>
            </div>
          </dl>

          <div className="product-detail__purchase">
            {hasSizes ? (
              <div className="product-detail__control">
                <label htmlFor="product-size">Size</label>
                <select
                  id="product-size"
                  value={size}
                  onChange={(event) => {
                    setSize(event.target.value);
                    setFeedback('');
                  }}
                >
                  <option value="">Choose a size</option>
                  {product.sizes.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="product-detail__control">
              <label htmlFor="product-quantity">Quantity</label>
              <input
                id="product-quantity"
                type="number"
                min="1"
                max="99"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              Add to cart
            </Button>
          </div>

          {feedback ? (
            <p className="product-detail__feedback" role="status">
              {feedback}{' '}
              {feedback === 'Added to your cart.' ? <Link to="/cart">View cart</Link> : null}
            </p>
          ) : null}

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
            <Button href={site.whatsapp.specialist} variant="secondary">
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
