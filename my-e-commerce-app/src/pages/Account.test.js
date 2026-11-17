import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Account from './Account';

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/account']}>
      <Account />
    </MemoryRouter>
  );
}

const user = { id: 'u1', email: 'ada@example.com', name: 'Ada Obi', role: 'CUSTOMER' };
const customer = {
  id: 'c1',
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  phone: '0803 123 4567',
  address: '12 Example Street',
  state: 'Lagos',
  city: 'Ikeja',
  orderCount: 1,
};
const order = {
  reference: 'IDB-20260101-ABCDEF',
  status: 'DISPATCHED',
  paymentStatus: 'PAID',
  total: 305000,
  tracking: { currentLabel: 'Dispatched' },
};

function mockSignedIn() {
  global.fetch = jest.fn((input) => {
    const url = String(input);
    if (url.includes('/auth/me')) return Promise.resolve(jsonResponse({ user }));
    if (url.includes('/customers/me/orders')) {
      return Promise.resolve(jsonResponse({ orders: [order] }));
    }
    if (url.includes('/customers/me')) {
      return Promise.resolve(jsonResponse({ customer }));
    }
    if (url.includes('/auth/logout')) return Promise.resolve(jsonResponse(null));
    return Promise.resolve(jsonResponse({}));
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('Account', () => {
  it('offers sign-in when there is no session', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ error: 'Authentication required.' }, { ok: false, status: 401 })
    );

    renderPage();

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /your details/i })).toBeNull();
  });

  it('shows only server-held customer details and order history', async () => {
    mockSignedIn();

    renderPage();

    expect(await screen.findByText(/signed in as ada obi/i)).toBeInTheDocument();
    expect(screen.getByText('12 Example Street')).toBeInTheDocument();
    expect(screen.getByText('IDB-20260101-ABCDEF')).toBeInTheDocument();
    expect(screen.getByText(/dispatched/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /track order/i })).toHaveAttribute(
      'href',
      '/track?reference=IDB-20260101-ABCDEF'
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/me/orders'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('clears the visible account when the customer signs out', async () => {
    mockSignedIn();
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
    expect(screen.queryByText('IDB-20260101-ABCDEF')).toBeNull();
  });

  it('can create a customer account from the storefront', async () => {
    global.fetch = jest.fn((input, options = {}) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        return Promise.resolve(
          jsonResponse({ error: 'Authentication required.' }, { ok: false, status: 401 })
        );
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve(jsonResponse({ user }, { status: 201 }));
      }
      if (url.includes('/customers/me/orders')) {
        return Promise.resolve(jsonResponse({ orders: [] }));
      }
      if (url.includes('/customers/me')) {
        return Promise.resolve(jsonResponse({ customer: null }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: /create account/i }));
    fireEvent.change(screen.getByLabelText(/name \(optional\)/i), {
      target: { value: 'Ada Obi' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'long-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/signed in as ada obi/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
