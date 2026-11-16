import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateOrderReference } from '../src/services/reference.js';

describe('generateOrderReference', () => {
  it('formats a UTC date and random suffix', () => {
    const reference = generateOrderReference(
      new Date('2026-01-05T23:59:59.000Z'),
      () => Buffer.from('deadbeef', 'hex')
    );

    assert.equal(reference, 'IDB-20260105-DEADBE');
  });

  it('matches the documented pattern', () => {
    assert.match(generateOrderReference(), /^IDB-\d{8}-[0-9A-F]{6}$/);
  });

  it('does not repeat references across many calls', () => {
    const seen = new Set();
    for (let i = 0; i < 500; i += 1) seen.add(generateOrderReference());
    assert.equal(seen.size, 500);
  });
});
