import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Paystack webhook signature verification (prd/agent.md section 9).
 *
 * Two formats are supported because Paystack is migrating integrations:
 *
 * 1. `Paystack-Signature: t=<unix>,v1=<kid>:<hex>[,v1=...]`
 *    HMAC-SHA512 of `<t>.<raw body>` keyed with the `whsec_...` signing secret.
 *    The timestamp is checked so a captured event cannot be replayed.
 *
 * 2. `x-paystack-signature: <hex>`
 *    Legacy HMAC-SHA512 of the raw body keyed with the secret key.
 *
 * The raw bytes must be used — re-serialising the JSON can change spacing,
 * number formats and escaping and invalidate the signature. Never compare
 * signatures with `===`; use a constant-time comparison.
 */

export const SIGNATURE_TOLERANCE_SECONDS = 300;
const HEX_SHA512 = /^[0-9a-f]{128}$/;

/** Verify the legacy `x-paystack-signature` header. */
export function verifyLegacySignature(rawBody, signature, secretKey) {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string' || !secretKey) {
    return false;
  }
  if (!HEX_SHA512.test(signature)) return false;

  const expected = createHmac('sha512', secretKey).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

/**
 * Verify the timestamped `Paystack-Signature` header.
 * Returns the matching key id (`whk_...`) or null when the event is not genuine,
 * too old, or malformed. Multiple `v1` entries (secret rotation) are checked.
 */
export function verifyPaystackSignature(
  rawBody,
  header,
  secrets,
  now = Math.floor(Date.now() / 1000)
) {
  if (!Buffer.isBuffer(rawBody) || typeof header !== 'string') return null;

  const secretList = (Array.isArray(secrets) ? secrets : [secrets]).filter(Boolean);
  if (secretList.length === 0) return null;

  let timestamp = null;
  const entries = [];

  for (const part of header.split(',')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === 't') {
      if (timestamp !== null || !/^[0-9]+$/.test(value)) return null;
      timestamp = Number(value);
    } else if (key === 'v1') {
      const colon = value.indexOf(':');
      if (colon !== -1) {
        entries.push({ kid: value.slice(0, colon), hex: value.slice(colon + 1) });
      }
    }
  }

  if (timestamp === null || entries.length === 0) return null;
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return null;

  for (const secret of secretList) {
    const expected = createHmac('sha512', secret)
      .update(`${timestamp}.`)
      .update(rawBody)
      .digest();

    for (const { kid, hex } of entries) {
      if (!HEX_SHA512.test(hex)) continue;
      if (timingSafeEqual(expected, Buffer.from(hex, 'hex'))) return kid;
    }
  }

  return null;
}

/**
 * Decide whether a webhook request is genuine using the configured secrets.
 * The caller must pass the raw, unparsed body.
 */
export function verifyWebhookRequest({
  rawBody,
  headers = {},
  secretKey,
  webhookSecret,
  now = Math.floor(Date.now() / 1000),
}) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) return false;

  if (webhookSecret) {
    return (
      verifyPaystackSignature(rawBody, headers['paystack-signature'], [webhookSecret], now) !== null
    );
  }

  if (!secretKey) return false;
  return verifyLegacySignature(rawBody, headers['x-paystack-signature'], secretKey);
}
