import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductList from './ProductList';
import ProductCard from './ProductCard';

const sampleProducts = [
  {
    id: 'p1',
    name: 'Budget Sleep Mattress (sample)',
    collection: 'budget-sleep',
    price: null,
    images: [],
    sizes: [],
    firmness: [],
    stockStatus: 'TBD',
    specs: {},
    isPlaceholder: true,
    isBestSeller: false,
    isNewArrival: true,
    dateAdded: '2026-01-05',
  },
];

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProductList states', () => {
  it('shows a loading indicator while loading', () => {
    render(<ProductList products={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', () => {
    render(<ProductList products={[]} emptyTitle="No products found" />);
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('renders an optional empty-state action', () => {
    render(
      <ProductList
        products={[]}
        emptyTitle="No products found"
        emptyAction={<a href="/collections">Browse collections</a>}
      />
    );
    expect(screen.getByRole('link', { name: /browse collections/i })).toBeInTheDocument();
  });

  it('renders product cards when products exist', () => {
    renderWithRouter(<ProductList products={sampleProducts} />);
    expect(screen.getByText('Budget Sleep Mattress (sample)')).toBeInTheDocument();
  });
});

describe('ProductCard', () => {
  it('shows "Price TBD" for placeholder products with no price', () => {
    renderWithRouter(<ProductCard product={sampleProducts[0]} />);
    expect(screen.getByText('Price TBD')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    renderWithRouter(<ProductCard product={sampleProducts[0]} />);
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toHaveAttribute('href', '/products/p1');
  });
});
