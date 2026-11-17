import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import request from 'supertest';

// This file exercises the payment routes end to end. The Paystack API is
// mocked at the client boundary: no real money, keys or network calls are used.
process.env.NODE_ENV = 'test';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_phase6_only';
process.env.PAYSTACK_WEBHOOK_SECRET = '';

const { default: app } = await import('../src/app.js');
const { default: prisma } = await import('../src/db.js');
const { paystack } = await import('../src/services/paystack.js');
const { default: bcrypt } = await import('bcryptjs');

let dbAvailable = false;
const stamp = Date.now();
const productId = `phase6-test-product-${stamp}`;
const adminEmail = `phase6.admin.${stamp}@example.test`;
const customerEmail = `phase6.customer.${stamp}@example.test`;
const adminPassword = 'phase6-test-password';

let adminAgent;
let product;
const customer = {
  fullName: 'Phase Six Customer',
  email: customerEmail,
  phone: '0803 000 0000',
  address: '1 Test Street',
  state: 'Lagos',
  city: 'Ikeja',
  deliveryInstructions: 'Call on arrival',
};

let orderReference;
let paymentReference;

const originalInitialize = paystack.initializeTransaction;
const originalVerify = paystack.verifyTransaction;

async function canReachDatabase() {
  let timer;
  try {
    await Promise.race([
      prisma.$queryRawUnsafe('SELECT 1'),
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('database timeout')), 15000);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function binaryParser(res, callback) {
  res.setEncoding('binary');
  res.data = '';
  res.on('data', (chunk) => {
    res.data += chunk;
  });
  res.on('end', () => callback(null, Buffer.from(res.data, 'binary')));
}

async function createOrder(quantity = 2) {
  const response = await request(app)
    .post('/api/orders')
    .send({
      items: [{ productId, size: '', quantity }],
      customer,
    });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.order;
}

before(async () => {
  dbAvailable = await canReachDatabase();
  if (!dbAvailable) return;

  const collection = await prisma.collection.upsert({
    where: { slug: 'budget-sleep' },
    update: {},
    create: {
      id: 'budget-sleep',
      slug: 'budget-sleep',
      name: 'Budget Sleep',
      position: 1,
    },
  });

  product = await prisma.product.create({
    data: {
      id: productId,
      slug: productId,
      name: 'Phase 6 test mattress',
      description: 'Test-only product. Never shown in the real catalogue.',
      collectionId: collection.id,
      price: 150_000,
      currency: 'NGN',
      sizes: [],
      firmness: ['Medium'],
      audiences: ['adult'],
      stockStatus: 'In stock',
      isPlaceholder: false,
      isArchived: false,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 4);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash },
    create: { email: adminEmail, passwordHash, name: 'Phase 6 Admin', role: 'ADMIN' },
  });

  adminAgent = request.agent(app);
  const login = await adminAgent.post('/api/auth/login').send({
    email: adminEmail,
    password: adminPassword,
  });
  assert.equal(login.status, 200, JSON.stringify(login.body));
});

after(async () => {
  paystack.initializeTransaction = originalInitialize;
  paystack.verifyTransaction = originalVerify;

  if (dbAvailable) {
    const customers = await prisma.customer.findMany({
      where: { email: { startsWith: 'phase6.' } },
      select: { id: true },
    });
    const customerIds = customers.map((record) => record.id);
    const orders = await prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    });
    const orderIds = orders.map((record) => record.id);

    await prisma.receipt.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'phase6.' } } });
    await prisma.product.deleteMany({ where: { id: productId } });
  }

  await prisma.$disconnect();
});

function skipWithoutDatabase(t) {
  if (!dbAvailable) {
    t.skip('DATABASE_URL is not reachable; payment integration checks were skipped.');
    return true;
  }
  return false;
}

describe('Phase 6 payments (mocked Paystack)', () => {
  it('creates an order priced by the server and refuses payment before a delivery quote', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const order = await createOrder(2);
    orderReference = order.reference;

    assert.equal(order.subtotal, 300_000);
    assert.equal(order.total, 300_000);
    assert.equal(order.requiresDeliveryQuote, true);
    assert.equal(product.price, 150_000);

    const response = await request(app)
      .post('/api/payments/initialize')
      .send({ reference: orderReference, email: customerEmail });

    assert.equal(response.status, 409);
    assert.match(response.body.error, /delivery charges.*not been confirmed/i);
  });

  it('does not reveal an order when the email does not match', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app)
      .post('/api/payments/initialize')
      .send({ reference: orderReference, email: 'someone.else@example.test' });

    assert.equal(response.status, 404);
  });

  it('lets an administrator confirm the delivery charge', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await adminAgent
      .patch(`/api/orders/${orderReference}/delivery`)
      .send({ deliveryFee: 5_000 });

    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.order.deliveryFee, 5_000);
    assert.equal(response.body.order.total, 305_000);
    assert.equal(response.body.order.requiresDeliveryQuote, false);
  });

  it('initialises a payment for the exact server-calculated total', async (t) => {
    if (skipWithoutDatabase(t)) return;

    let initialisedAmountKobo = null;
    paystack.initializeTransaction = async ({ amountKobo, reference }) => {
      initialisedAmountKobo = amountKobo;
      assert.match(reference, /^IDB-PAY-\d{8}-[0-9A-F]{6}$/);
      return {
        authorization_url: 'https://checkout.paystack.com/phase6-test',
        access_code: 'test_access_code',
        channel: 'card',
      };
    };

    const response = await request(app)
      .post('/api/payments/initialize')
      .send({ reference: orderReference, email: customerEmail });

    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(initialisedAmountKobo, 305_000 * 100);
    assert.equal(response.body.authorizationUrl, 'https://checkout.paystack.com/phase6-test');
    assert.equal(response.body.payment.amount, 305_000);
    assert.equal(response.body.payment.currency, 'NGN');
    assert.equal(response.body.payment.status, 'PENDING');
    paymentReference = response.body.payment.reference;
  });

  it('verifies with Paystack before marking the order paid and issuing one receipt', async (t) => {
    if (skipWithoutDatabase(t)) return;

    paystack.verifyTransaction = async (reference) => ({
      reference,
      status: 'success',
      amount: 305_000 * 100,
      currency: 'NGN',
      channel: 'card',
      paid_at: new Date().toISOString(),
      gateway_response: 'Successful',
    });

    const response = await request(app)
      .get(`/api/payments/verify/${paymentReference}`)
      .query({ email: customerEmail });

    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.payment.status, 'PAID');
    assert.equal(response.body.payment.method, 'CARD');
    assert.equal(response.body.order.paymentStatus, 'PAID');
    assert.equal(response.body.order.status, 'PAYMENT_CONFIRMED');
    assert.equal(response.body.alreadyProcessed, false);

    const receipts = await prisma.receipt.findMany({
      where: { order: { reference: orderReference } },
    });
    assert.equal(receipts.length, 1);
    assert.equal(receipts[0].totalPaid, 305_000);
    assert.equal(receipts[0].transactionReference, paymentReference);
    assert.match(receipts[0].receiptNumber, /^IDB-RCPT-\d{8}-[0-9A-F]{6}$/);
  });

  it('is idempotent on repeated verification and replayed webhooks', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const again = await request(app)
      .get(`/api/payments/verify/${paymentReference}`)
      .query({ email: customerEmail });

    assert.equal(again.status, 200);
    assert.equal(again.body.alreadyProcessed, true);

    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: paymentReference,
        status: 'success',
        amount: 305_000 * 100,
        currency: 'NGN',
        channel: 'card',
        paid_at: new Date().toISOString(),
        gateway_response: 'Successful',
      },
    });
    const signature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');

    const webhook = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(payload);

    assert.equal(webhook.status, 200, JSON.stringify(webhook.body));

    const receipts = await prisma.receipt.count({
      where: { order: { reference: orderReference } },
    });
    assert.equal(receipts, 1);
  });

  it('rejects a forged webhook signature', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const payload = JSON.stringify({
      event: 'charge.success',
      data: { reference: paymentReference, status: 'success' },
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', '0'.repeat(128))
      .send(payload);

    assert.equal(response.status, 401);
  });

  it('serves a PDF receipt to the guest who owns the order and hides it otherwise', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const receipt = await request(app)
      .post(`/api/orders/${orderReference}/receipt`)
      .buffer(true)
      .parse(binaryParser)
      .send({ email: customerEmail });

    assert.equal(receipt.status, 200, JSON.stringify(receipt.body));
    assert.match(receipt.headers['content-type'], /application\/pdf/);
    assert.match(receipt.headers['content-disposition'], /receipt-IDB-RCPT-/);
    assert.equal(receipt.body.subarray(0, 4).toString(), '%PDF');

    const forbidden = await request(app)
      .post(`/api/orders/${orderReference}/receipt`)
      .send({ email: 'someone.else@example.test' });

    assert.equal(forbidden.status, 404);
  });

  it('refuses to change the delivery fee on a paid order', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await adminAgent
      .patch(`/api/orders/${orderReference}/delivery`)
      .send({ deliveryFee: 1_000 });

    assert.equal(response.status, 409);
  });

  it('refuses to settle when Paystack reports a different amount', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const order = await createOrder(1);
    await adminAgent.patch(`/api/orders/${order.reference}/delivery`).send({ deliveryFee: 0 });

    const initialized = await request(app)
      .post('/api/payments/initialize')
      .send({ reference: order.reference, email: customerEmail });

    assert.equal(initialized.status, 201, JSON.stringify(initialized.body));

    paystack.verifyTransaction = async (reference) => ({
      reference,
      status: 'success',
      amount: 150_000 * 100 + 100,
      currency: 'NGN',
      channel: 'card',
      paid_at: new Date().toISOString(),
      gateway_response: 'Successful',
    });

    const response = await request(app)
      .get(`/api/payments/verify/${initialized.body.payment.reference}`)
      .query({ email: customerEmail });

    assert.equal(response.status, 409);
    assert.match(response.body.error, /amount paid does not match/i);

    const stored = await prisma.order.findUnique({ where: { reference: order.reference } });
    assert.equal(stored.paymentStatus, 'PENDING');
    assert.equal(stored.status, 'ORDER_PLACED');

    const receipt = await request(app)
      .post(`/api/orders/${order.reference}/receipt`)
      .send({ email: customerEmail });
    assert.equal(receipt.status, 409);
  });
});
