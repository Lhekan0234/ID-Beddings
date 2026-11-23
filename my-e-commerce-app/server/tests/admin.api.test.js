import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { default: prisma } = await import('../src/db.js');

let dbAvailable = false;
const stamp = Date.now();
const collectionId = `phase8-collection-${stamp}`;
const productId = `phase8-product-${stamp}`;
const adminEmail = `phase8.admin.${stamp}@example.test`;
const customerEmail = `phase8.customer.${stamp}@example.test`;
const password = 'phase8-test-password';

let adminAgent;
let customerAgent;
let customerId;
let orderId;
let paidReference;
let pendingReference;
let formulaReference;
let createdProductId;
let createdCollectionId;
let originalSettings = [];

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
    t.skip('DATABASE_URL is not reachable; admin integration checks were skipped.');
    return true;
  }
  return false;
}

async function signedInAgent(email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return agent;
}

before(async () => {
  dbAvailable = await canReachDatabase();
  if (!dbAvailable) return;

  originalSettings = await prisma.setting.findMany({
    where: { key: { in: ['contact', 'hours', 'delivery'] } },
  });

  await prisma.collection.create({
    data: {
      id: collectionId,
      slug: collectionId,
      name: 'Phase 8 Test Collection',
      position: 9000,
    },
  });
  await prisma.product.create({
    data: {
      id: productId,
      slug: productId,
      name: 'Phase 8 test mattress',
      description: 'Test-only product. Never shown in the real catalogue.',
      collectionId,
      price: 200000,
      currency: 'NGN',
      sizes: [],
      firmness: [],
      audiences: [],
      stockStatus: 'In stock',
      isPlaceholder: false,
      isArchived: false,
    },
  });

  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.create({
    data: { email: adminEmail, passwordHash, name: 'Phase 8 Admin', role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { email: customerEmail, passwordHash, name: 'Phase 8 Customer', role: 'CUSTOMER' },
  });

  const customer = await prisma.customer.create({
    data: {
      fullName: 'Phase 8 Customer',
      email: customerEmail,
      phone: '0803 999 8888',
      address: '9 Test Road',
      state: 'Lagos',
      city: 'Ikeja',
    },
  });
  customerId = customer.id;

  const order = await prisma.order.create({
    data: {
      reference: `IDB-P8-${stamp}`,
      customerId,
      subtotal: 200000,
      total: 200000,
      paymentStatus: 'PAID',
      status: 'PAYMENT_CONFIRMED',
      items: {
        create: [
          {
            productId,
            nameSnapshot: 'Phase 8 test mattress',
            size: '',
            unitPrice: 200000,
            quantity: 1,
            lineTotal: 200000,
          },
        ],
      },
    },
  });
  orderId = order.id;

  paidReference = `PAY-P8-PAID-${stamp}`;
  await prisma.payment.create({
    data: {
      orderId,
      provider: 'paystack',
      reference: paidReference,
      status: 'PAID',
      method: 'CARD',
      amount: 200000,
      currency: 'NGN',
      paidAt: new Date(),
    },
  });

  pendingReference = `PAY-P8-PENDING-${stamp}`;
  await prisma.payment.create({
    data: {
      orderId,
      provider: 'paystack',
      reference: pendingReference,
      status: 'PENDING',
      method: 'BANK_TRANSFER',
      amount: 200000,
      currency: 'NGN',
    },
  });

  // A reference that looks like a spreadsheet formula must be neutralised in CSV.
  formulaReference = `=CMD|P8-${stamp}`;
  await prisma.payment.create({
    data: {
      orderId,
      provider: 'paystack',
      reference: formulaReference,
      status: 'FAILED',
      amount: 0,
      currency: 'NGN',
    },
  });

  adminAgent = await signedInAgent(adminEmail);
  customerAgent = await signedInAgent(customerEmail);
});

after(async () => {
  if (dbAvailable) {
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, customerEmail] } },
    });
    if (createdProductId) {
      await prisma.product.deleteMany({ where: { id: createdProductId } });
    }
    await prisma.product.deleteMany({ where: { id: productId } });
    if (createdCollectionId) {
      await prisma.collection.deleteMany({ where: { id: createdCollectionId } });
    }
    await prisma.collection.deleteMany({ where: { id: collectionId } });

    // Restore the settings we changed so the suite stays isolated.
    for (const key of ['contact', 'hours', 'delivery']) {
      const original = originalSettings.find((row) => row.key === key);
      if (original) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: original.value },
          create: { key, value: original.value },
        });
      } else {
        await prisma.setting.deleteMany({ where: { key } });
      }
    }
  }
  await prisma.$disconnect();
});

describe('Phase 8 admin API protection', () => {
  it('rejects anonymous access to every admin area', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const paths = [
      '/api/admin/overview',
      '/api/admin/sales',
      '/api/admin/sales/export.csv',
      '/api/admin/products',
      '/api/admin/collections',
      '/api/admin/settings',
    ];
    for (const path of paths) {
      const response = await request(app).get(path);
      assert.equal(response.status, 401, `${path} should require a session`);
    }
  });

  it('refuses customer accounts even with a valid session', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const paths = [
      '/api/admin/overview',
      '/api/admin/sales',
      '/api/admin/products',
      '/api/admin/collections',
      '/api/admin/settings',
    ];
    for (const path of paths) {
      const response = await customerAgent.get(path);
      assert.equal(response.status, 403, `${path} should require admin role`);
    }
  });
});

describe('Phase 8 admin reporting', () => {
  it('derives overview figures from real database records only', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await adminAgent.get('/api/admin/overview');
    assert.equal(response.status, 200, JSON.stringify(response.body));

    const [paidAggregate, orderCount, customerCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.order.count(),
      prisma.customer.count(),
    ]);

    assert.equal(response.body.overview.verifiedRevenue, paidAggregate._sum.amount || 0);
    assert.equal(response.body.overview.verifiedPayments, paidAggregate._count._all);
    assert.equal(response.body.overview.totalOrders, orderCount);
    assert.equal(response.body.overview.customerCount, customerCount);
    assert.ok(response.body.overview.pendingOrders >= 0);
    assert.equal(response.body.overview.currency, 'NGN');
    assert.ok(
      response.body.overview.recentTransactions.some((tx) => tx.reference === paidReference)
    );
    assert.ok(
      response.body.overview.recentTransactions.every((tx) => tx.status === 'PAID')
    );
  });

  it('searches and filters real payment records', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const search = await adminAgent.get('/api/admin/sales').query({ q: paidReference });
    assert.equal(search.status, 200, JSON.stringify(search.body));
    assert.equal(search.body.pagination.total, 1);
    assert.equal(search.body.transactions[0].reference, paidReference);
    assert.equal(search.body.transactions[0].orderReference, `IDB-P8-${stamp}`);
    assert.equal(search.body.transactions[0].customerEmail, customerEmail);

    const byStatus = await adminAgent.get('/api/admin/sales').query({ paymentStatus: 'PENDING' });
    assert.equal(byStatus.status, 200);
    assert.ok(byStatus.body.transactions.some((tx) => tx.reference === pendingReference));
    assert.ok(byStatus.body.transactions.every((tx) => tx.status === 'PENDING'));

    const byMethod = await adminAgent.get('/api/admin/sales').query({ paymentMethod: 'CARD' });
    assert.equal(byMethod.status, 200);
    assert.ok(byMethod.body.transactions.every((tx) => tx.method === 'CARD'));

    const byDate = await adminAgent.get('/api/admin/sales').query({
      from: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      to: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    });
    assert.equal(byDate.status, 200);
    assert.ok(byDate.body.transactions.some((tx) => tx.reference === paidReference));
  });

  it('exports CSV safely with escaped spreadsheet formulas', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await adminAgent
      .get('/api/admin/sales/export.csv')
      .query({ q: `P8-${stamp}` });
    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/csv/);
    assert.match(response.headers['content-disposition'], /attachment/);
    assert.match(response.text, /^Payment reference,Order reference/);
    assert.match(response.text, new RegExp(paidReference));
    // A formula-looking reference must be prefixed with an apostrophe.
    assert.ok(
      response.text.includes(`'${formulaReference}`),
      'CSV export must neutralise spreadsheet formulas'
    );
    assert.ok(!response.text.includes(`\n${formulaReference}`));
  });
});

describe('Phase 8 admin catalogue management', () => {
  const validProduct = () => ({
    name: 'Phase 8 Created Product',
    description: 'A real product created by the admin dashboard test.',
    collectionId,
    price: 145000,
    currency: 'NGN',
    sizes: ['Single', 'Double'],
    firmness: ['Medium'],
    audiences: ['adult'],
    stockStatus: 'In stock',
    stockQuantity: 4,
    images: ['/images/phase8-test.jpg'],
    isBestSeller: false,
    isNewArrival: true,
    isArchived: false,
  });

  it('validates new product data on the server', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const invalid = await adminAgent
      .post('/api/admin/products')
      .send({ ...validProduct(), collectionId: 'missing-collection' });
    assert.equal(invalid.status, 400);

    const tooShort = await adminAgent
      .post('/api/admin/products')
      .send({ ...validProduct(), description: 'short' });
    assert.equal(tooShort.status, 400);
  });

  it('creates, updates, archives and lists products', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const created = await adminAgent.post('/api/admin/products').send(validProduct());
    assert.equal(created.status, 201, JSON.stringify(created.body));
    createdProductId = created.body.product.id;
    assert.equal(created.body.product.isPlaceholder, false);
    assert.equal(created.body.product.price, 145000);
    assert.deepEqual(created.body.product.images, ['/images/phase8-test.jpg']);
    assert.equal(created.body.product.collectionName, 'Phase 8 Test Collection');

    const updated = await adminAgent
      .patch(`/api/admin/products/${createdProductId}`)
      .send({
        price: 150000,
        stockStatus: 'Out of stock',
        stockQuantity: 0,
        isArchived: true,
        images: ['/images/phase8-updated.jpg'],
      });
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.product.price, 150000);
    assert.equal(updated.body.product.stockStatus, 'Out of stock');
    assert.equal(updated.body.product.isArchived, true);
    assert.deepEqual(updated.body.product.images, ['/images/phase8-updated.jpg']);
    // Untouched fields must not be wiped by defaults on a partial update.
    assert.equal(updated.body.product.name, 'Phase 8 Created Product');
    assert.deepEqual(updated.body.product.sizes, ['Single', 'Double']);

    const listed = await adminAgent.get('/api/admin/products').query({ q: 'Created Product' });
    assert.equal(listed.status, 200);
    assert.ok(listed.body.products.some((p) => p.id === createdProductId));

    const liveOnly = await adminAgent
      .get('/api/admin/products')
      .query({ q: 'Created Product', includeArchived: 'false' });
    assert.equal(liveOnly.status, 200);
    assert.ok(!liveOnly.body.products.some((p) => p.id === createdProductId));
  });

  it('creates and updates collections', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const created = await adminAgent.post('/api/admin/collections').send({
      name: 'Phase 8 Admin Collection',
      slug: `phase8-admin-collection-${stamp}`,
      description: 'Managed through the admin dashboard test.',
      position: 9001,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    createdCollectionId = created.body.collection.id;

    const updated = await adminAgent
      .patch(`/api/admin/collections/${createdCollectionId}`)
      .send({ name: 'Phase 8 Renamed Collection', position: 9002 });
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.collection.name, 'Phase 8 Renamed Collection');
    assert.equal(updated.body.collection.position, 9002);

    const listed = await adminAgent.get('/api/admin/collections');
    assert.equal(listed.status, 200);
    assert.ok(listed.body.collections.some((c) => c.id === createdCollectionId));
  });
});

describe('Phase 8 admin settings', () => {
  it('shows honest blank defaults and saves owner-supplied values', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const before = await adminAgent.get('/api/admin/settings');
    assert.equal(before.status, 200, JSON.stringify(before.body));
    assert.equal(before.body.settings.delivery.fee, null);
    assert.equal(before.body.settings.whatsapp.verified, false);

    const saved = await adminAgent.put('/api/admin/settings').send({
      contact: { phone: '+234 800 000 0000' },
      delivery: { fee: 2500, note: 'Confirmed by the owner for this test.' },
    });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.settings.contact.phone, '+234 800 000 0000');
    assert.equal(saved.body.settings.delivery.fee, 2500);
    // Owner-supplied contact details remain null until actually provided.
    assert.equal(saved.body.settings.contact.email, null);
    assert.equal(saved.body.settings.contact.address, null);
  });

  it('never allows the WhatsApp verified flag to be set through the API', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const attempt = await adminAgent.put('/api/admin/settings').send({
      whatsapp: {
        catalogue: 'https://wa.me/c/2349087201583',
        specialist: 'https://wa.me/c/2348038526476',
        verified: true,
      },
    });
    assert.equal(attempt.status, 400, 'verified is not a writable setting');

    const afterAttempt = await adminAgent.get('/api/admin/settings');
    assert.equal(afterAttempt.body.settings.whatsapp.verified, false);
  });
});
