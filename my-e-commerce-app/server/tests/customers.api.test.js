import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { default: prisma } = await import('../src/db.js');

let dbAvailable = false;
const stamp = Date.now();
const productId = `phase7-test-product-${stamp}`;
const adminEmail = `phase7.admin.${stamp}@example.test`;
const customerEmail = `phase7.customer.${stamp}@example.test`;
const otherEmail = `phase7.other.${stamp}@example.test`;
const password = 'phase7-test-password';

const guestCustomer = {
  fullName: 'Phase Seven Customer',
  email: customerEmail,
  phone: '0803 111 2222',
  address: '7 Test Road',
  state: 'Lagos',
  city: 'Ikeja',
};

let adminAgent;
let customerAgent;
let otherAgent;
let orderReference;
let cancelledReference;
let customerId;

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

function skipWithoutDatabase(t) {
  if (!dbAvailable) {
    t.skip('DATABASE_URL is not reachable; customer integration checks were skipped.');
    return true;
  }
  return false;
}

async function createOrder(email = customerEmail) {
  const response = await request(app)
    .post('/api/orders')
    .send({
      items: [{ productId, size: '', quantity: 1 }],
      customer: { ...guestCustomer, email },
    });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.order;
}

async function signedInAgent(email, name) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.user.name, name);
  return agent;
}

before(async () => {
  dbAvailable = await canReachDatabase();
  if (!dbAvailable) return;

  await prisma.collection.upsert({
    where: { slug: 'budget-sleep' },
    update: {},
    create: {
      id: 'budget-sleep',
      slug: 'budget-sleep',
      name: 'Budget Sleep',
      position: 1,
    },
  });

  await prisma.product.create({
    data: {
      id: productId,
      slug: productId,
      name: 'Phase 7 test mattress',
      description: 'Test-only product. Never shown in the real catalogue.',
      collectionId: 'budget-sleep',
      price: 120_000,
      currency: 'NGN',
      sizes: [],
      firmness: ['Medium'],
      audiences: ['adult'],
      stockStatus: 'In stock',
      isPlaceholder: false,
      isArchived: false,
    },
  });

  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash },
    create: { email: adminEmail, passwordHash, name: 'Phase 7 Admin', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: otherEmail },
    update: { role: 'CUSTOMER', passwordHash },
    create: { email: otherEmail, passwordHash, name: 'Other Customer', role: 'CUSTOMER' },
  });

  // Guest order first: registering afterwards must attach this real record.
  const order = await createOrder();
  orderReference = order.reference;
  const cancelled = await createOrder();
  cancelledReference = cancelled.reference;

  const registration = await request(app).post('/api/auth/register').send({
    name: 'Phase Seven Customer',
    email: customerEmail,
    password,
  });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));

  const record = await prisma.customer.findUnique({ where: { email: customerEmail } });
  customerId = record.id;
  assert.equal(record.userId, registration.body.user.id);

  adminAgent = await signedInAgent(adminEmail, 'Phase 7 Admin');
  customerAgent = await signedInAgent(customerEmail, 'Phase Seven Customer');
  otherAgent = await signedInAgent(otherEmail, 'Other Customer');
});

after(async () => {
  if (dbAvailable) {
    const customerIds = [customerId].filter(Boolean);
    const orders = await prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      select: { id: true },
    });
    await prisma.order.deleteMany({ where: { id: { in: orders.map((order) => order.id) } } });
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, customerEmail, otherEmail] } },
    });
    await prisma.product.deleteMany({ where: { id: productId } });
  }
  await prisma.$disconnect();
});

describe('Phase 7 customer records and delivery tracking', () => {
  it('requires a session for customer records and admin rights for search', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const anonymous = await request(app).get('/api/customers/me');
    assert.equal(anonymous.status, 401);

    const forbidden = await otherAgent.get('/api/customers');
    assert.equal(forbidden.status, 403);
  });

  it('returns only the signed-in customer’s own record and history', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await customerAgent.get('/api/customers/me');
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.customer.fullName, 'Phase Seven Customer');
    assert.equal(response.body.customer.email, customerEmail);
    assert.equal(response.body.customer.orderCount, 2);
    assert.equal(response.body.customer.passwordHash, undefined);
    assert.equal(response.body.customer.userId, undefined);

    const history = await customerAgent.get('/api/customers/me/orders');
    assert.equal(history.status, 200);
    assert.equal(history.body.pagination.total, 2);
    assert.equal(history.body.orders.length, 2);
    assert.ok(history.body.orders.every((order) => order.tracking.isLiveGps === false));
  });

  it('gives a user with no orders an empty history rather than invented data', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const profile = await otherAgent.get('/api/customers/me');
    assert.equal(profile.status, 200);
    assert.equal(profile.body.customer, null);

    const history = await otherAgent.get('/api/customers/me/orders');
    assert.equal(history.status, 200);
    assert.deepEqual(history.body.orders, []);
    assert.equal(history.body.pagination.total, 0);
  });

  it('lets an administrator search real customers and open their order history', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const search = await adminAgent.get('/api/customers').query({ q: 'phase seven' });
    assert.equal(search.status, 200, JSON.stringify(search.body));
    assert.equal(search.body.customers.length, 1);
    assert.equal(search.body.customers[0].email, customerEmail);

    const detail = await adminAgent.get(`/api/customers/${customerId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.orders.length, 2);
    assert.equal(detail.body.customer.passwordHash, undefined);
  });

  it('refuses fulfilment before payment and manual payment confirmation', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const early = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'PROCESSING' });
    assert.equal(early.status, 409);
    assert.match(early.body.error, /payment has been verified/i);

    const manual = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'PAYMENT_CONFIRMED' });
    assert.equal(manual.status, 409);

    // Simulate the Phase 6 verified-payment outcome at the database boundary.
    await prisma.order.update({
      where: { reference: orderReference },
      data: { paymentStatus: 'PAID', status: 'PAYMENT_CONFIRMED' },
    });
  });

  it('requires a note for dispatch and rejects backwards status changes', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const processing = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'PROCESSING', note: 'Preparing your order.' });
    assert.equal(processing.status, 200, JSON.stringify(processing.body));

    const noNote = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'DISPATCHED' });
    assert.equal(noNote.status, 400);

    const dispatched = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'DISPATCHED', note: 'Handed to courier.' });
    assert.equal(dispatched.status, 200, JSON.stringify(dispatched.body));

    const backwards = await adminAgent
      .patch(`/api/orders/${orderReference}/status`)
      .send({ status: 'ORDER_PLACED' });
    assert.equal(backwards.status, 409);
  });

  it('shows the recorded notes in secure order tracking without claiming GPS', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const tracked = await request(app)
      .post('/api/orders/track')
      .send({ reference: orderReference, email: customerEmail });
    assert.equal(tracked.status, 200, JSON.stringify(tracked.body));

    const timeline = tracked.body.order.tracking;
    assert.equal(timeline.isLiveGps, false);
    assert.equal(timeline.currentStatus, 'DISPATCHED');
    assert.equal(timeline.notes.some((note) => note.note === 'Handed to courier.'), true);
    assert.equal(timeline.steps.length, 6);

    const wrongEmail = await request(app)
      .post('/api/orders/track')
      .send({ reference: orderReference, email: otherEmail });
    assert.equal(wrongEmail.status, 404);
  });

  it('can cancel an unpaid order but cannot resume it afterwards', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const cancelled = await adminAgent
      .patch(`/api/orders/${cancelledReference}/status`)
      .send({ status: 'CANCELLED', note: 'Cancelled before payment.' });
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));

    const resumed = await adminAgent
      .patch(`/api/orders/${cancelledReference}/status`)
      .send({ status: 'PROCESSING' });
    assert.equal(resumed.status, 409);

    const tracked = await request(app)
      .post('/api/orders/track')
      .send({ reference: cancelledReference, email: customerEmail });
    assert.equal(tracked.body.order.tracking.cancellation.label, 'Cancelled');
  });
});
