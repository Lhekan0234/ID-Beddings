import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderSchema,
  productQuerySchema,
  recommendationSchema,
  registerSchema,
} from '../src/validation/schemas.js';

const validCustomer = {
  fullName: 'Ada Obi',
  email: '  Ada@Example.com ',
  phone: '0803 123 4567',
  address: '12 Example Street',
  state: 'Lagos',
  city: 'Ikeja',
  deliveryInstructions: 'Call on arrival',
};

describe('createOrderSchema', () => {
  it('normalises email and applies optional defaults', () => {
    const parsed = createOrderSchema.parse({
      items: [{ productId: 'p1', quantity: 2 }],
      customer: { ...validCustomer, deliveryInstructions: undefined },
    });

    assert.equal(parsed.customer.email, 'ada@example.com');
    assert.equal(parsed.customer.deliveryInstructions, '');
    assert.equal(parsed.items[0].size, '');
    assert.equal(parsed.items[0].quantity, 2);
  });

  it('coerces numeric strings for quantity', () => {
    const parsed = createOrderSchema.parse({
      items: [{ productId: 'p1', quantity: '3' }],
      customer: validCustomer,
    });
    assert.equal(parsed.items[0].quantity, 3);
  });

  it('rejects an empty cart, missing customer fields and bad phone numbers', () => {
    assert.equal(createOrderSchema.safeParse({ items: [], customer: validCustomer }).success, false);
    assert.equal(createOrderSchema.safeParse({ items: [{ productId: 'p1', quantity: 1 }], customer: {} }).success, false);
    assert.equal(
      createOrderSchema.safeParse({
        items: [{ productId: 'p1', quantity: 1 }],
        customer: { ...validCustomer, phone: 'call me' },
      }).success,
      false
    );
  });

  it('rejects quantities outside 1–99 and more than 50 distinct items', () => {
    for (const quantity of [0, 100, 1.5]) {
      assert.equal(
        createOrderSchema.safeParse({
          items: [{ productId: 'p1', quantity }],
          customer: validCustomer,
        }).success,
        false
      );
    }

    const tooMany = Array.from({ length: 51 }, (_, index) => ({
      productId: `p${index}`,
      quantity: 1,
    }));
    assert.equal(createOrderSchema.safeParse({ items: tooMany, customer: validCustomer }).success, false);
  });
});

describe('recommendationSchema', () => {
  it('accepts every documented answer', () => {
    assert.equal(
      recommendationSchema.safeParse({
        audience: 'guest-room',
        firmness: 'Orthopedic',
        budget: 'premium',
      }).success,
      true
    );
  });

  it('rejects values outside the documented options', () => {
    assert.equal(
      recommendationSchema.safeParse({ audience: 'alien', firmness: 'Soft', budget: 'premium' })
        .success,
      false
    );
  });
});

describe('registerSchema', () => {
  it('requires an 8 character password', () => {
    assert.equal(
      registerSchema.safeParse({ email: 'a@example.com', password: 'short' }).success,
      false
    );
    assert.equal(
      registerSchema.safeParse({ email: 'a@example.com', password: 'longenough' }).success,
      true
    );
  });
});

describe('productQuerySchema', () => {
  it('defaults to featured sort and validates known sorts', () => {
    assert.equal(productQuerySchema.parse({}).sort, 'featured');
    assert.equal(productQuerySchema.safeParse({ sort: 'price-asc' }).success, true);
    assert.equal(productQuerySchema.safeParse({ sort: 'cheapest' }).success, false);
  });
});
