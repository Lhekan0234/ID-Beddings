import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSalesWhere,
  escapeCsvCell,
  serialiseTransaction,
  transactionsToCsv,
  verifiedRevenue,
} from '../src/services/adminReports.js';

describe('buildSalesWhere', () => {
  it('maps payment method and status filters', () => {
    const where = buildSalesWhere({ paymentMethod: 'CARD', paymentStatus: 'PAID' });
    assert.equal(where.method, 'CARD');
    assert.equal(where.status, 'PAID');
  });

  it('builds an inclusive UTC date range', () => {
    const where = buildSalesWhere({ from: '2026-01-01', to: '2026-01-31' });
    assert.equal(where.createdAt.gte.toISOString(), '2026-01-01T00:00:00.000Z');
    assert.equal(where.createdAt.lte.toISOString(), '2026-01-31T23:59:59.999Z');
  });

  it('searches payment reference, order reference and customer email', () => {
    const where = buildSalesWhere({ q: 'ada@example.com' });
    assert.equal(where.OR.length, 3);
    assert.equal(where.OR[2].order.customer.email.contains, 'ada@example.com');
  });

  it('returns an empty filter for no criteria', () => {
    assert.deepEqual(buildSalesWhere({}), {});
  });
});

describe('verifiedRevenue', () => {
  it('counts only PAID payments', () => {
    const revenue = verifiedRevenue([
      { status: 'PAID', amount: 100000 },
      { status: 'FAILED', amount: 100000 },
      { status: 'PENDING', amount: 100000 },
      { status: 'PAID', amount: 5000 },
    ]);
    assert.equal(revenue, 105000);
  });
});

describe('CSV export', () => {
  it('escapes quotes, commas and spreadsheet formulas', () => {
    assert.equal(escapeCsvCell('plain'), 'plain');
    assert.equal(escapeCsvCell('a,b'), '"a,b"');
    assert.equal(escapeCsvCell('say "hello"'), '"say ""hello"""');
    assert.equal(escapeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
    assert.equal(escapeCsvCell(null), '');
  });

  it('writes a header and one row per transaction', () => {
    const transaction = serialiseTransaction({
      reference: 'IDB-PAY-1',
      amount: 105000,
      currency: 'NGN',
      status: 'PAID',
      method: 'CARD',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      paidAt: new Date('2026-01-01T10:01:00.000Z'),
      order: { reference: 'IDB-ORDER-1', customer: { email: 'ada@example.com' } },
    });

    const csv = transactionsToCsv([transaction]);
    const lines = csv.trim().split('\r\n');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /^Payment reference,Order reference,Customer email,Status/);
    assert.match(lines[1], /^IDB-PAY-1,IDB-ORDER-1,ada@example\.com,PAID,CARD,105000,NGN/);
    assert.equal(transaction.orderReference, 'IDB-ORDER-1');
  });
});
