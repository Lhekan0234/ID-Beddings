import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Admin from './Admin';

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  };
}

function renderAdmin(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Admin />
    </MemoryRouter>
  );
}

const adminUser = {
  id: 'admin-1',
  email: 'owner@example.test',
  name: 'Business Owner',
  role: 'ADMIN',
};

const overview = {
  verifiedRevenue: 305000,
  verifiedPayments: 1,
  totalOrders: 3,
  pendingOrders: 2,
  customerCount: 2,
  currency: 'NGN',
  recentTransactions: [
    {
      reference: 'PAY-1',
      orderReference: 'IDB-1',
      customerEmail: 'ada@example.test',
      status: 'PAID',
      method: 'CARD',
      amount: 305000,
      createdAt: '2026-01-01T10:00:00.000Z',
      paidAt: '2026-01-01T10:01:00.000Z',
    },
  ],
};

function mockAdminApi() {
  global.fetch = jest.fn((input) => {
    const url = String(input);
    if (url.includes('/auth/me')) return Promise.resolve(jsonResponse({ user: adminUser }));
    if (url.includes('/admin/overview')) return Promise.resolve(jsonResponse({ overview }));
    return Promise.resolve(jsonResponse({}));
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('Admin dashboard', () => {
  it('refuses visitors who are not signed-in administrators', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ error: 'Authentication required.' }, { ok: false, status: 401 })
    );

    renderAdmin();

    expect(
      await screen.findByText(/sign in with an administrator account/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Overview' })).toBeNull();
    expect(screen.getByRole('link', { name: /go to account/i })).toHaveAttribute('href', '/account');
  });

  it('refuses signed-in customers even if they open the URL directly', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        user: { id: 'c1', email: 'ada@example.test', role: 'CUSTOMER' },
      })
    );

    renderAdmin();

    expect(
      await screen.findByText(/restricted to authorised administrators/i)
    ).toBeInTheDocument();
  });

  it('shows real overview figures to an administrator', async () => {
    mockAdminApi();

    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText(/signed in as business owner/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('PAY-1')).toBeInTheDocument();
    expect(screen.getByText(/only payments verified by the payment provider/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/overview'),
      expect.anything()
    );
  });

  it('navigates between all six admin sections', async () => {
    mockAdminApi();

    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    for (const label of ['Sales', 'Products', 'Orders', 'Customers', 'Settings']) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
      // Each section loads from the protected API rather than local data.
      await screen.findByRole('heading', { name: label });
    }
  });
});
