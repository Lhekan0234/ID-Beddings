import { Link } from 'react-router-dom';
import { getCollectionBySlug } from '../../data/products';
import { formatPrice } from '../../utils/format';
import ProductImage from '../ui/ProductImage';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import site from '../../config/site';
import { AUDIENCE_OPTIONS, BUDGET_OPTIONS } from '../../utils/recommend';
import './RecommendationResults.css';

function ResultCard({ product }) {
  const collection = getCollectionBySlug(product.collection);
  const firmness = Array.isArray(product.firmness) ? product.firmness : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const specs = product.specs && Object.keys(product.specs).length ? Object.entries(product.specs) : [];

  return (
    <article className="recommendation-result">
      <Link to={`/products/${product.id}`} className="recommendation-result__media">
        <ProductImage product={product} />
      </Link>

      <div className="recommendation-result__body">
        {collection ? (
          <span className="recommendation-result__collection">{collection.name}</span>
        ) : null}

        <h3 className="recommendation-result__title">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>

        <p className="recommendation-result__price">{formatPrice(product.price)}</p>

        <dl className="recommendation-result__specs">
          <div>
            <dt>Firmness</dt>
            <dd>{firmness.length ? firmness.join(', ') : 'To be confirmed'}</dd>
          </div>
          <div>
            <dt>Sizes</dt>
            <dd>{sizes.length ? sizes.join(', ') : 'To be confirmed'}</dd>
          </div>
          {specs.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>

        <div className="recommendation-result__badges">
          {product.isPlaceholder && <Badge tone="warning">Sample listing</Badge>}
          {product.stockStatus === 'In stock' && <Badge tone="success">In stock</Badge>}
        </div>

        <Button to={`/products/${product.id}`} variant="secondary" size="sm">
          View details
        </Button>
      </div>
    </article>
  );
}

/**
 * Renders the catalogue results for a submitted recommendation (prd/agent.md
 * section 7). Shows images, real prices, specifications and links to the
 * product detail pages, with an informative empty state when nothing matches.
 */
export default function RecommendationResults({ answers, matches }) {
  const headingId = 'recommendation-results-heading';
  const audienceLabel =
    AUDIENCE_OPTIONS.find((option) => option.value === answers?.audience)?.label ||
    answers?.audience;
  const budgetLabel =
    BUDGET_OPTIONS.find((option) => option.value === answers?.budget)?.label ||
    answers?.budget;

  return (
    <section className="recommendation-results" aria-labelledby={headingId} aria-live="polite">
      <div className="recommendation-results__header">
        <h2 id={headingId}>Matching options</h2>
        <p className="text-muted">
          {audienceLabel} · {answers?.firmness} firmness · {budgetLabel} budget —{' '}
          {matches.length} {matches.length === 1 ? 'mattress' : 'mattresses'} match your answers.
        </p>
      </div>

      {matches.length > 0 ? (
        <ul className="recommendation-results__grid">
          {matches.map((product) => (
            <li key={product.id}>
              <ResultCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No matching mattresses yet"
          message="None of the products currently in the catalogue match all three answers. The catalogue is still being finalised, so please chat with a mattress specialist and we will help you find the right fit."
          action={
            <Button href={site.whatsapp.specialist} variant="primary">
              Chat with a mattress specialist
            </Button>
          }
        />
      )}
    </section>
  );
}
