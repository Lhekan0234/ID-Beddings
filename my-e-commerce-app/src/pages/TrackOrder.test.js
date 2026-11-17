import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrackOrder from './TrackOrder';

const paidOrder = {
  reference: 'IDB-20260101-ABCDEF',
  paymentStatus: 'PAID',
  total: 305000,
  items: [
    {
      productId: 'p1',
      name: 'Test Mattress',
      size: '',
      quantity: 2,
      lineTotal: 305000,
    },
  ],
  tracking: {
    currentStatus: 'DISPATCHED',
    currentLabel: 'Dispatched',
    isLiveGps: false,
    note: 'Delivery progress is updated manually by our team. This is not live GPS tracking.',
    steps: [
      {
        status: 'ORDER_PLACED',
        label: 'Order placed',
        description: 'We have received your order.',
        reached: true,
        current: false,
        at: '2026-01-01T10:00:00.000Z',
      },
      {
        status: 'DISPATCHED',
        label: 'Dispatched',
        description: 'Your order has left us.',
        reached: true,
        current: true,
        at: '2026-01-02T10:00:00.000Z',
      },
    ],
    notes: [
      {
        label: 'Dispatched',
        note: 'Handed to courier.',
        at: '2026-01-02T10:00:00.000Z',
      },
    ],
    cancellation: null,
  },
};

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  };
}

function renderPage(path = '/track') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TrackOrder />
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('TrackOrder', () => {
  it('asks for the checkout email and shows server-recorded progress', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ order: paidOrder }));
    renderPage('/track?reference=IDB-20260101-ABCDEF');

    expect(screen.getByLabelText(/order reference/i)).toHaveValue(
      'IDB-20260101-ABCDEF'
    );
    fireEvent.change(screen.getByLabelText(/email used at checkout/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /check order status/i }));

    expect(await screen.findByText('Order IDB-20260101-ABCDEF')).toBeInTheDocument();
    expect(screen.getAllByText('Dispatched').length).toBeGreaterThan(0);
    expect(screen.getByText('Handed to courier.')).toBeInTheDocument();
    expect(screen.getByText(/not live GPS tracking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download pdf receipt/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders/track'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('does not claim a receipt before payment is verified', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        order: { ...paidOrder, paymentStatus: 'PENDING' },
      })
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/order reference/i), {
      target: { value: paidOrder.reference },
    });
    fireEvent.change(screen.getByLabelText(/email used at checkout/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /check order status/i }));

    expect(
      await screen.findByText(/no receipt is available until payment has been verified/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf receipt/i })).toBeNull();
  });

  it('shows the server error for a mismatched reference and email', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(
        { error: 'No order matches that reference and email address.' },
        { ok: false, status: 404 }
      )
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/order reference/i), {
      target: { value: paidOrder.reference },
    });
    fireEvent.change(screen.getByLabelText(/email used at checkout/i), {
      target: { value: 'someone@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /check order status/i }));

    expect(
      await screen.findByText('No order matches that reference and email address.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Order IDB-20260101-ABCDEF')).toBeNull();
  });

  it('offers owner-supplied WhatsApp help without inventing a chat link', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /need help with an order/i })).toBeInTheDocument();
    const catalogue = screen.getByRole('link', { name: /view catalogue on whatsapp/i });
    expect(catalogue).toHaveAttribute('href', 'https://wa.me/c/2349087201583');
    expect(screen.getByText(/pending verification/i)).toBeInTheDocument();
  });
});
