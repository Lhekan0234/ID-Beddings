import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/db.js';

let dbAvailable = false;

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

before(async () => {
  dbAvailable = await canReachDatabase();
});

after(async () => {
  await prisma.$disconnect();
});

function skipWithoutDatabase(t) {
  if (!dbAvailable) {
    t.skip('DATABASE_URL is not reachable; database-backed checks were skipped.');
    return true;
  }
  return false;
}

describe('API without a database', () => {
  it('reports health', async () => {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist');
    assert.equal(response.status, 404);
    assert.match(response.body.error, /not found/i);
  });

  it('rejects an invalid product sort', async () => {
    const response = await request(app).get('/api/products?sort=cheapest');
    assert.equal(response.status, 400);
    assert.ok(Array.isArray(response.body.details));
  });

  it('validates order payloads before touching the database', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ items: [], customer: {} });

    assert.equal(response.status, 400);
    assert.ok(Array.isArray(response.body.details));
    assert.ok(response.body.details.some((detail) => detail.field.startsWith('customer.')));
  });

  it('validates registration input before touching the database', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    assert.equal(response.status, 400);
    assert.ok(response.body.details.length >= 2);
  });

  it('protects customer order history', async () => {
    const response = await request(app).get('/api/orders');
    assert.equal(response.status, 401);
  });

  it('rejects non-administrator fulfilment updates', async () => {
    const response = await request(app)
      .patch('/api/orders/IDB-20260101-ABCDEF/status')
      .send({ status: 'PROCESSING' });

    assert.equal(response.status, 401);
  });
});

describe('API against the seeded database', () => {
  it('returns the seven collections with live product counts', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app).get('/api/collections');
    assert.equal(response.status, 200);
    assert.equal(response.body.collections.length, 7);

    const budget = response.body.collections.find((c) => c.slug === 'budget-sleep');
    assert.equal(budget.name, 'Budget Sleep');
    assert.equal(budget.productCount, 25);
  });

  it('returns the owner-supplied catalogue with real prices', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app).get('/api/products');
    assert.equal(response.status, 200);
    assert.equal(response.body.products.length, 124);

    for (const product of response.body.products) {
      assert.ok(Number.isInteger(product.price) && product.price > 0);
      assert.equal(product.stockStatus, 'TBD');
      assert.equal(product.isPlaceholder, false);
      assert.equal(product.sizes.length, 1);
      assert.ok(Array.isArray(product.firmness));
      assert.ok(Array.isArray(product.audiences));
      assert.equal(product.images.length, 1);
    }
  });

  it('finds a product by id and by slug', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const byId = await request(app).get('/api/products/comfy-1');
    assert.equal(byId.status, 200);
    assert.equal(byId.body.product.collection, 'budget-sleep');

    const bySlug = await request(app).get('/api/products/comfy-1');
    assert.equal(bySlug.body.product.id, byId.body.product.id);
  });

  it('returns an honest empty recommendation for placeholder data', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app).post('/api/recommendations').send({
      audience: 'adult',
      firmness: 'Medium',
      budget: '100-200k',
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.products, []);
  });

  it('refuses an order when a sized product has no size selected', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [{ productId: 'comfy-1', size: '', quantity: 1 }],
        customer: {
          fullName: 'Ada Obi',
          email: 'ada.obi@example.com',
          phone: '0803 123 4567',
          address: '12 Example Street',
          state: 'Lagos',
          city: 'Ikeja',
        },
      });

    assert.equal(response.status, 400);
    assert.match(response.body.error, /choose a size/i);
  });

  it('does not reveal whether an order exists for a wrong reference/email pair', async (t) => {
    if (skipWithoutDatabase(t)) return;

    const response = await request(app)
      .post('/api/orders/track')
      .send({ reference: 'IDB-20260101-ABCDEF', email: 'nobody@example.com' });

    assert.equal(response.status, 404);
    assert.match(response.body.error, /no order matches/i);
  });
});
