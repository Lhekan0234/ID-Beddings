import './ProductImage.css';

/**
 * Displays a product image when a URL is provided, otherwise renders an
 * accessible local placeholder.
 *
 * prd/agent.md section 5: "Product images must be stored or referenced using a
 * reliable image-storage approach. Do not hotlink private or temporary images."
 * Until real (Cloudinary/S3) images are supplied we show a local placeholder and
 * never hotlink external images.
 */
export default function ProductImage({ product, alt, className = '' }) {
  const firstImage = Array.isArray(product?.images) && product.images.length > 0
    ? product.images[0]
    : null;

  const label = alt || product?.name || 'Product image';

  if (firstImage) {
    return (
      <span className={`product-image-wrap ${className}`}>
        <img
          src={firstImage}
          alt={label}
          className="product-image"
          loading="lazy"
        />
        {product?.isImageIllustrative ? (
          <span className="product-image__note">Illustrative only</span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className={`product-image product-image--placeholder ${className}`}
      role="img"
      aria-label={`${label} — image coming soon`}
    >
      <span className="product-image__icon" aria-hidden="true">
        🛏️
      </span>
      <span className="product-image__hint">Image coming soon</span>
    </div>
  );
}
