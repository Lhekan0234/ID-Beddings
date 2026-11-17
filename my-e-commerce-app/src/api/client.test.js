import {
  ApiError,
  LAST_ORDER_KEY,
  apiRequest,
  apiUrl,
  downloadReceipt,
  readLastOrder,
  rememberLastOrder,
  verifyPayment,
} from './client';

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
  };
}

describe('apiUrl', () => {
  it('uses the configured base URL and joins paths safely', () => {
    expect(apiUrl('/orders')).toBe('http://localhost:5000/api/orders');
    expect(apiUrl('orders')).toBe('http://localhost:5000/api/orders');
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('sends credentialed JSON and returns the parsed response', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ order: { reference: 'IDB-1' } }));

    const result = await apiRequest('/orders', { method: 'POST', body: { items: [] } });

    expect(result).toEqual({ order: { reference: 'IDB-1' } });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/orders',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      })
    );
  });

  it('turns server errors into ApiError with status and messages', async () => {
    global.fetch.mockResolvedValue(
      jsonResponse(
        { error: 'Please check the submitted details.', details: [{ field: 'email' }] },
        { ok: false, status: 400 }
      )
    );

    await expect(apiRequest('/orders', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Please check the submitted details.',
    });
  });

  it('reports a network failure without leaking internals', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/products')).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest('/products')).rejects.toThrow(/could not reach/i);
  });
});

describe('verifyPayment', () => {
  it('encodes the reference and email in the query string', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ payment: { status: 'PAID' } }));

    await verifyPayment('IDB-PAY-1/2', 'ada+buyer@example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/payments/verify/IDB-PAY-1%2F2?email=ada%2Bbuyer%40example.com',
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
  });
});

describe('downloadReceipt', () => {
  it('returns the PDF blob for a verified payment', async () => {
    const blob = new Blob(['%PDF-test']);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/pdf' },
      blob: async () => blob,
    });

    await expect(downloadReceipt({ reference: 'IDB-1', email: 'a@example.com' })).resolves.toBe(
      blob
    );
  });

  it('throws a readable error for a pending order', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ error: 'A receipt is available only after payment has been verified.' }, {
        ok: false,
        status: 409,
      })
    );

    await expect(
      downloadReceipt({ reference: 'IDB-1', email: 'a@example.com' })
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('last order convenience cache', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('round-trips the reference and email for the callback page', () => {
    rememberLastOrder({ reference: 'IDB-1', email: 'a@example.com' });
    expect(readLastOrder()).toEqual({ reference: 'IDB-1', email: 'a@example.com' });
    expect(window.sessionStorage.getItem(LAST_ORDER_KEY)).toContain('IDB-1');
  });

  it('ignores malformed stored data', () => {
    window.sessionStorage.setItem(LAST_ORDER_KEY, '{not json');
    expect(readLastOrder()).toBeNull();

    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ reference: 'IDB-1' }));
    expect(readLastOrder()).toBeNull();
  });
});
