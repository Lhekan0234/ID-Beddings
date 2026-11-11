import ProductCard from './ProductCard';

/** Responsive grid of product cards. */
export default function ProductGrid({ products }) {
  return (
    <ul className="product-grid" aria-label="Products">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
