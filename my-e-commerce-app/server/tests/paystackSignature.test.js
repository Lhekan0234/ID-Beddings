import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  SIGNATURE_TOLERANCE_SECONDS,
  verifyLegacySignature,
  verifyPaystackSignature,
  verifyWebhookRequest,
} from '../src/services/paystackSignature.js';

const rawBody = Buffer.from('{"event":"charge.success","data":{"reference":"IDB-PAY-1"}}');
const secretKey = 'sk_test_example_secret';
const webhookSecret = 'whsec_example_signing_secret';

const legacySignature = (body = rawBody) =>
  createHmac('sha512', secretKey).update(body).digest('hex');

const modernHeader = (timestamp, secret = webhookSecret, body = rawBody, kid = 'whk_test') => {
  const signature = createHmac('sha512', secret)
    .update(`${timestamp}.`)
    .update(body)
    .digest('hex');
  return { header: `t=${timestamp},v1=${kid}:${signature}`, signature };
};

describe('legacy x-paystack-signature', () => {
  it('accepts a signature computed with the secret key', () => {
    assert.equal(verifyLegacySignature(rawBody, legacySignature(), secretKey), true);
  });

  it('rejects a tampered body, wrong key and malformed signatures', () => {
    const tampered = Buffer.from('{"event":"charge.success","data":{"reference":"IDB-PAY-2"}}');
    assert.equal(verifyLegacySignature(tampered, legacySignature(), secretKey), false);
    assert.equal(verifyLegacySignature(rawBody, legacySignature(), 'sk_test_other'), false);
    assert.equal(verifyLegacySignature(rawBody, 'not-hex', secretKey), false);
    assert.equal(verifyLegacySignature(rawBody, legacySignature().toUpperCase(), secretKey), false);
    assert.equal(verifyLegacySignature('a string', legacySignature(), secretKey), false);
  });
});

describe('Paystack-Signature header', () => {
  const timestamp = 1_760_275_200;

  it('accepts a timestamped signature and returns the key id', () => {
    const { header } = modernHeader(timestamp);
    assert.equal(verifyPaystackSignature(rawBody, header, [webhookSecret], timestamp), 'whk_test');
  });

  it('accepts any matching v1 entry during secret rotation', () => {
    const oldSecret = 'whsec_old';
    const newSignature = modernHeader(timestamp, webhookSecret).signature;
    const oldSignature = createHmac('sha512', oldSecret)
      .update(`${timestamp}.`)
      .update(rawBody)
      .digest('hex');
    const header = `t=${timestamp},v1=whk_old:${oldSignature},v1=whk_new:${newSignature}`;

    assert.equal(verifyPaystackSignature(rawBody, header, [oldSecret, webhookSecret], timestamp), 'whk_old');
  });

  it('rejects signatures older or newer than the tolerance window', () => {
    const { header } = modernHeader(timestamp);
    assert.equal(
      verifyPaystackSignature(rawBody, header, [webhookSecret], timestamp + SIGNATURE_TOLERANCE_SECONDS + 1),
      null
    );
    assert.equal(
      verifyPaystackSignature(rawBody, header, [webhookSecret], timestamp - SIGNATURE_TOLERANCE_SECONDS - 1),
      null
    );
  });

  it('rejects a tampered body, wrong secret and malformed headers', () => {
    const { header } = modernHeader(timestamp);
    const tampered = Buffer.from('{"event":"charge.success","data":{"reference":"IDB-PAY-2"}}');

    assert.equal(verifyPaystackSignature(tampered, header, [webhookSecret], timestamp), null);
    assert.equal(verifyPaystackSignature(rawBody, header, ['whsec_other'], timestamp), null);
    assert.equal(verifyPaystackSignature(rawBody, 'nonsense', [webhookSecret], timestamp), null);
    assert.equal(verifyPaystackSignature(rawBody, 'v1=whk_test:abc', [webhookSecret], timestamp), null);
    assert.equal(verifyPaystackSignature(rawBody, header, [], timestamp), null);
  });
});

describe('verifyWebhookRequest', () => {
  const headersFor = (header, legacy) => ({
    ...(header ? { 'paystack-signature': header } : {}),
    ...(legacy ? { 'x-paystack-signature': legacy } : {}),
  });

  it('prefers the webhook signing secret when configured', () => {
    const { header } = modernHeader(1_760_275_200);
    assert.equal(
      verifyWebhookRequest({
        rawBody,
        headers: headersFor(header, legacySignature()),
        secretKey,
        webhookSecret,
        now: 1_760_275_200,
      }),
      true
    );
  });

  it('falls back to the legacy header when no webhook secret is configured', () => {
    assert.equal(
      verifyWebhookRequest({
        rawBody,
        headers: headersFor(null, legacySignature()),
        secretKey,
        webhookSecret: '',
      }),
      true
    );
  });

  it('rejects an empty body or missing secrets', () => {
    assert.equal(
      verifyWebhookRequest({ rawBody: Buffer.alloc(0), headers: {}, secretKey, webhookSecret }),
      false
    );
    assert.equal(
      verifyWebhookRequest({ rawBody, headers: {}, secretKey: '', webhookSecret: '' }),
      false
    );
  });
});
