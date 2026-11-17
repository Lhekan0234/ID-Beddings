import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { LAST_ORDER_KEY } from '../api/client';
import PaymentCallback from './PaymentCallback';

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  };
}

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <PaymentCallback />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('PaymentCallback', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('asks the server to verify before showing a confirmed payment', async () => {
    window.sessionStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({ reference: 'IDB-20260101-ABCDEF', email: 'ada@example.com' })
    );
    global.fetch.mockResolvedValue(
      jsonResponse({
        payment: {
          reference: 'IDB-PAY-20260101-ABCDEF',
          status: 'PAID',
          amount: 305_000,
          method: 'CARD',
          channel: 'card',
        },
        order: { reference: 'IDB-20260101-ABCDEF', status: 'PAYMENT_CONFIRMED' },
        alreadyProcessed: false,
      })
    );

    renderPage('/payment/callback?reference=IDB-PAY-20260101-ABCDEF');

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(screen.getByText('IDB-20260101-ABCDEF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download pdf receipt/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/payments/verify/IDB-PAY-20260101-ABCDEF?email=ada%40example.com'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('does not claim success for a pending payment', async () => {
    window.sessionStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify({ reference: 'IDB-20260101-ABCDEF', email: 'ada@example.com' })
    );
    global.fetch.mockResolvedValue(
      jsonResponse({
        payment: { reference: 'IDB-PAY-20260101-ABCDEF', status: 'PENDING' },
        order: { reference: 'IDB-20260101-ABCDEF', status: 'ORDER_PLACED' },
        alreadyProcessed: false,
      })
    );

    renderPage('/payment/callback?reference=IDB-PAY-20260101-ABCDEF');

    expect(await screen.findByText(/payment not confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment confirmed/i)).not.toBeInTheDocument();
  });

  it('asks for the checkout email when the redirect has no stored session', async () => {
    renderPage('/payment/callback?reference=IDB-PAY-20260101-ABCDEF');

    expect(
      await screen.findByLabelText(/email address used at checkout/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('explains a missing reference instead of guessing', async () => {
    renderPage('/payment/callback');

    expect(await screen.findByText(/no payment reference/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
