import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Helper: render <App /> at a given starting route.
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App storefront routing', () => {
  it('renders the homepage with the business headline', () => {
    renderAt('/');
    // Business name and tagline come from config/site.js
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /better night's sleep/i
    );
    expect(screen.getAllByText(/ID Beddings and More/i).length).toBeGreaterThan(0);
  });

  it('renders the collections overview page', () => {
    renderAt('/collections');
    expect(screen.getByRole('heading', { name: /collections/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the contact page', () => {
    renderAt('/contact');
    expect(screen.getByRole('heading', { name: /contact & support/i })).toBeInTheDocument();
  });

  it('renders a 404 page for unknown routes', () => {
    renderAt('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

