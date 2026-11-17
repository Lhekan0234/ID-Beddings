// =============================================================================
// Storefront API client (prd/agent.md sections 8, 9 and 14)
// =============================================================================
// The React app never calculates the amount it pays: it sends the cart and the
// server responds with the authoritative order total. Payment always starts on
// the server so the Paystack secret key never reaches the browser.
// =============================================================================

const DEFAULT_API_URL = 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, status = 0, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function apiUrl(path = '') {
  const base = (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function readJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'We could not reach the store server. Check your connection and try again.'
    );
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      payload?.error || 'Something went wrong. Please try again.',
      response.status,
      payload?.details
    );
  }
  return payload;
}

export function createOrder(payload) {
  return apiRequest('/orders', { method: 'POST', body: payload });
}

export function initializePayment(payload) {
  return apiRequest('/payments/initialize', { method: 'POST', body: payload });
}

export function verifyPayment(reference, email) {
  const query = `email=${encodeURIComponent(email || '')}`;
  return apiRequest(`/payments/verify/${encodeURIComponent(reference)}?${query}`);
}

/**
 * Download the PDF receipt. The server only returns a file after it has
 * verified payment; a pending order gets a JSON 409 instead.
 */
export async function downloadReceipt({ reference, email }) {
  let response;
  try {
    response = await fetch(apiUrl(`/orders/${encodeURIComponent(reference)}/receipt`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new ApiError('We could not reach the store server. Please try again.');
  }

  if (!response.ok) {
    const payload = await readJson(response);
    throw new ApiError(
      payload?.error || 'The receipt could not be downloaded.',
      response.status
    );
  }

  return response.blob();
}

export const LAST_ORDER_KEY = 'idb-last-order';

/** Convenience only: remembers which order to verify after the redirect. */
export function rememberLastOrder({ reference, email }) {
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ reference, email }));
  } catch {
    // Session storage can be unavailable; verification still works manually.
  }
}

export function readLastOrder() {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
