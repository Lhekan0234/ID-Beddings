import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTransactionMatchesPayment,
  generatePaymentReference,
  generateReceiptNumber,
  mapChannelToMethod,
  mapTransactionStatus,
} from '../src/services/payments.js';

describe('payment and receipt references', () => {
  it('use the documented formats', () => {
    assert.match(generatePaymentReference(), /^IDB-PAY-\d{8}-[0-9A-F]{6}$/);
    assert.match(generateReceiptNumber(), /^IDB-RCPT-\d{8}-[0-9A-F]{6}$/);
  });

  it('use the UTC date and a random suffix', () => {
    const reference = generatePaymentReference(
      new Date('2026-02-03T23:59:59.000Z'),
      () => Buffer.from('deadbeef', 'hex')
    );
    assert.equal(reference, 'IDB-PAY-20260203-DEADBE');
  });

  it('do not repeat across many calls', () => {
    const payments = new Set();
    const receipts = new Set();
    for (let i = 0; i < 500; i += 1) {
      payments.add(generatePaymentReference());
      receipts.add(generateReceiptNumber());
    }
    assert.equal(payments.size, 500);
    assert.equal(receipts.size, 500);
  });
});

describe('mapTransactionStatus', () => {
  it('maps Paystack statuses to database statuses', () => {
    assert.equal(mapTransactionStatus('success'), 'PAID');
    assert.equal(mapTransactionStatus('failed'), 'FAILED');
    assert.equal(mapTransactionStatus('reversed'), 'FAILED');
    assert.equal(mapTransactionStatus('abandoned'), 'EXPIRED');
    assert.equal(mapTransactionStatus('pending'), 'PENDING');
    assert.equal(mapTransactionStatus('ongoing'), 'PENDING');
    assert.equal(mapTransactionStatus(undefined), 'PENDING');
  });
});

describe('mapChannelToMethod', () => {
  it('maps the PRD payment methods', () => {
    assert.equal(mapChannelToMethod('card'), 'CARD');
    assert.equal(mapChannelToMethod('bank_transfer'), 'BANK_TRANSFER');
    assert.equal(mapChannelToMethod('eft'), 'BANK_TRANSFER');
    assert.equal(mapChannelToMethod('bank'), 'PAY_BY_BANK');
    assert.equal(mapChannelToMethod('ussd'), null);
    assert.equal(mapChannelToMethod(undefined), null);
  });
});

describe('assertTransactionMatchesPayment', () => {
  const payment = {
    reference: 'IDB-PAY-20260203-ABCDEF',
    amount: 305_000,
    currency: 'NGN',
  };

  const transaction = {
    reference: payment.reference,
    amount: payment.amount * 100,
    currency: 'NGN',
  };

  it('accepts the exact reference, amount in kobo and currency', () => {
    assert.doesNotThrow(() => assertTransactionMatchesPayment(payment, transaction));
  });

  it('rejects a different reference', () => {
    assert.throws(
      () => assertTransactionMatchesPayment(payment, { ...transaction, reference: 'other' }),
      /reference does not match/i
    );
  });

  it('rejects underpayment and overpayment', () => {
    assert.throws(
      () => assertTransactionMatchesPayment(payment, { ...transaction, amount: transaction.amount - 1 }),
      /amount paid does not match/i
    );
    assert.throws(
      () => assertTransactionMatchesPayment(payment, { ...transaction, amount: transaction.amount + 1 }),
      /amount paid does not match/i
    );
  });

  it('rejects a different currency', () => {
    assert.throws(
      () => assertTransactionMatchesPayment(payment, { ...transaction, currency: 'USD' }),
      /currency does not match/i
    );
  });
});
