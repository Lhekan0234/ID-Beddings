import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { CART_STORAGE_KEY } from './context/CartContext';

// Helper: render <App /> at a given starting route.
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('App storefront routing', () => {
  it('renders the homepage with the business headline', () => {
    renderAt('/');
    // Business name and tagline come from config/site.js
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /better night's sleep/i
    );
    expect(screen.getAllByText(/ID Beddings and More/i).length).toBeGreaterThan(0);
  });

  it('offers the mattress recommendation call to action', () => {
    renderAt('/');
    const link = screen.getByRole('link', {
      name: 'Which mattress is right for me?',
    });
    expect(link).toHaveAttribute('href', '/find-your-mattress');
  });

  it('renders the recommendation page', () => {
    renderAt('/find-your-mattress');
    expect(
      screen.getByRole('heading', { name: /which mattress is right for me/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Matching Options' })
    ).toBeInTheDocument();
  });

  it('renders the collections overview page', () => {
    renderAt('/collections');
    expect(screen.getByRole('heading', { name: /collections/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the contact page', () => {
    renderAt('/contact');
    expect(screen.getByRole('heading', { name: /contact & support/i })).toBeInTheDocument();
  });

  it('renders the empty cart state', () => {
    renderAt('/cart');
    expect(screen.getByRole('heading', { name: /your cart/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders a saved cart with its quantities', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'comfy-1', size: '75X30X4', quantity: 2 }])
    );

    renderAt('/cart');

    expect(
      screen.getByRole('heading', { name: /COMFY \(75X30X4\)/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText(/2 items in your cart/i)).toBeInTheDocument();
  });

  it('validates the checkout form before showing a review', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'comfy-1', size: '75X30X4', quantity: 1 }])
    );

    renderAt('/checkout');

    fireEvent.click(screen.getByRole('button', { name: /continue to review/i }));

    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email address is required.')).toBeInTheDocument();
    expect(screen.queryByText(/review your order/i)).not.toBeInTheDocument();
  });

  it('renders the checkout empty state when the cart is empty', () => {
    renderAt('/checkout');
    expect(screen.getByRole('heading', { name: /checkout/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders a 404 page for unknown routes', () => {
    renderAt('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
