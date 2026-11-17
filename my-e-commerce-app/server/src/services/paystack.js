import { config } from '../config.js';
import { ApiError } from '../middleware/errors.js';

/**
 * Paystack API client (prd/agent.md section 9, Phase 6).
 *
 * Only the operations this store needs are implemented:
 *   - initialise a transaction (returns the hosted checkout URL)
 *   - verify a transaction by reference
 *
 * Secret keys stay in server-side environment variables. The browser only ever
 * receives the hosted `authorization_url`; card details are entered on
 * Paystack's page and never touch this application.
 */

const PAYSTACK_TIMEOUT_MS = 15_000;

export function createPaystackClient({
  secretKey = config.paystack.secretKey,
  baseUrl = config.paystack.baseUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs = PAYSTACK_TIMEOUT_MS,
} = {}) {
  const isConfigured = Boolean(secretKey);

  async function request(path, options = {}) {
    if (!isConfigured) {
      throw new ApiError(
        503,
        'Online payment is not configured yet. Please contact us to complete your order.'
      );
    }

    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      // Network failures, DNS problems and timeouts must not leak internals.
      throw new ApiError(
        502,
        'We could not reach the payment provider. Please try again in a moment.'
      );
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Fall through to the generic provider error below.
    }

    if (!response.ok || !payload || payload.status !== true) {
      throw new ApiError(
        502,
        payload?.message || 'The payment provider rejected the request. Please try again.'
      );
    }

    return payload.data;
  }

  return {
    isConfigured,

    /** POST /transaction/initialize — amount is in the currency subunit (kobo). */
    initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
      return request('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email,
          amount: amountKobo,
          reference,
          callback_url: callbackUrl,
          // Cards, bank transfer and pay-by-bank (prd/agent.md section 9).
          channels: ['card', 'bank', 'bank_transfer'],
          metadata,
        }),
      });
    },

    /** GET /transaction/verify/:reference — the only proof of payment we trust. */
    verifyTransaction(reference) {
      return request(`/transaction/verify/${encodeURIComponent(reference)}`);
    },
  };
}

export const paystack = createPaystackClient();

export default paystack;
