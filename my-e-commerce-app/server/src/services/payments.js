import { randomBytes } from 'node:crypto';
import prisma from '../db.js';
import { ApiError } from '../middleware/errors.js';

/**
 * Payment records and settlement (prd/agent.md sections 9 and 10, Phase 6).
 *
 * Rules enforced here:
 *   - A payment is only complete after Paystack's verify endpoint (or a
 *     signature-verified webhook) says `success`.
 *   - Amount, currency and reference must match the server's own order totals.
 *   - Repeated webhook deliveries and repeated verify calls are idempotent.
 *   - A receipt is created exactly once per paid order.
 */

export const PAYMENT_PROVIDER = 'paystack';

function utcDate(now) {
  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
}

function randomSuffix(bytes) {
  return bytes(4).toString('hex').toUpperCase().slice(0, 6);
}

/** IDB-PAY-YYYYMMDD-XXXXXX — unique per payment attempt. */
export function generatePaymentReference(now = new Date(), bytes = randomBytes) {
  return `IDB-PAY-${utcDate(now)}-${randomSuffix(bytes)}`;
}

/** IDB-RCPT-YYYYMMDD-XXXXXX — unique receipt number. */
export function generateReceiptNumber(now = new Date(), bytes = randomBytes) {
  return `IDB-RCPT-${utcDate(now)}-${randomSuffix(bytes)}`;
}

/** Map a Paystack transaction status to our PaymentStatus enum. */
export function mapTransactionStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'success':
      return 'PAID';
    case 'failed':
    case 'reversed':
      return 'FAILED';
    case 'abandoned':
    case 'expired':
      return 'EXPIRED';
    default:
      return 'PENDING';
  }
}

/** Map a Paystack channel to the payment methods named in the PRD. */
export function mapChannelToMethod(channel) {
  switch (String(channel || '').toLowerCase()) {
    case 'card':
      return 'CARD';
    case 'bank_transfer':
    case 'eft':
      return 'BANK_TRANSFER';
    case 'bank':
      return 'PAY_BY_BANK';
    default:
      return null;
  }
}

/**
 * The provider must have charged exactly the amount the server calculated,
 * in the order currency, against this payment reference.
 */
export function assertTransactionMatchesPayment(payment, transaction) {
  if (!transaction || transaction.reference !== payment.reference) {
    throw new ApiError(409, 'The payment reference does not match this order.');
  }
  if (Number(transaction.amount) !== Number(payment.amount) * 100) {
    throw new ApiError(
      409,
      'The amount paid does not match the order total. Please contact us before retrying.'
    );
  }
  if (
    String(transaction.currency || '').toUpperCase() !== String(payment.currency).toUpperCase()
  ) {
    throw new ApiError(409, 'The payment currency does not match this order.');
  }
}

async function markFailed(client, payment, transaction, outcome) {
  const channel = typeof transaction?.channel === 'string' ? transaction.channel : null;
  const reason =
    transaction?.gateway_response ||
    (outcome === 'EXPIRED'
      ? 'The customer did not complete the payment.'
      : 'The payment provider reported that the payment failed.');

  const updated = await client.payment.update({
    where: { id: payment.id },
    data: {
      status: outcome,
      channel,
      failureReason: reason,
      verifiedAt: new Date(),
    },
  });

  await client.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: 'FAILED' },
  });

  await client.orderEvent.create({
    data: {
      orderId: payment.orderId,
      note: `Payment ${outcome === 'EXPIRED' ? 'expired' : 'failed'} at ${PAYMENT_PROVIDER}. ${reason}`,
    },
  });

  return updated;
}

/**
 * Apply a Paystack transaction result to a payment record.
 *
 * @param {string} paymentId
 * @param {object} transaction Paystack `data` object
 * @param {{client?: object}} [options]
 */
export async function applyPaymentTransaction(paymentId, transaction, { client = prisma } = {}) {
  const current = await client.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!current) {
    throw ApiError.notFound('Payment not found.');
  }

  // Already settled: webhook retries and a later browser verify must be no-ops.
  if (current.status === 'PAID') {
    return { payment: current, order: current.order, receipt: null, alreadyProcessed: true };
  }

  const outcome = mapTransactionStatus(transaction?.status);

  // Money must never silently confirm a cancelled order. Record the payment as
  // failed and leave an explicit note so the owner can refund it if charged.
  if (outcome === 'PAID' && current.order.status === 'CANCELLED') {
    const payment = await client.payment.update({
      where: { id: current.id },
      data: {
        status: 'FAILED',
        channel: typeof transaction?.channel === 'string' ? transaction.channel : null,
        failureReason: 'Payment arrived after the order was cancelled. Refund if charged.',
        verifiedAt: new Date(),
      },
    });
    await client.orderEvent.create({
      data: {
        orderId: current.orderId,
        note: 'A payment arrived after this order was cancelled. Review and refund if the customer was charged.',
      },
    });
    return { payment, order: current.order, receipt: null, alreadyProcessed: false };
  }

  if (outcome !== 'PAID') {
    if (outcome === 'PENDING') {
      const payment = await client.payment.update({
        where: { id: current.id },
        data: { verifiedAt: new Date() },
      });
      return { payment, order: current.order, receipt: null, alreadyProcessed: false };
    }

    const payment = await markFailed(client, current, transaction, outcome);
    return { payment, order: current.order, receipt: null, alreadyProcessed: false };
  }

  assertTransactionMatchesPayment(current, transaction);

  const channel = typeof transaction.channel === 'string' ? transaction.channel : null;
  const method = mapChannelToMethod(channel);
  const paidAt = transaction.paid_at ? new Date(transaction.paid_at) : new Date();

  return client.$transaction(async (tx) => {
    // Conditional update: only one concurrent worker can move PENDING -> PAID.
    const claimed = await tx.payment.updateMany({
      where: { id: current.id, status: { not: 'PAID' } },
      data: {
        status: 'PAID',
        channel,
        method,
        failureReason: null,
        paidAt,
        verifiedAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      const payment = await tx.payment.findUnique({ where: { id: current.id } });
      return { payment, order: current.order, receipt: null, alreadyProcessed: true };
    }

    const order = await tx.order.update({
      where: { id: current.orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PAYMENT_CONFIRMED',
        paymentMethod: method,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: current.orderId,
        status: 'PAYMENT_CONFIRMED',
        note: `Payment verified by ${PAYMENT_PROVIDER} (reference ${current.reference}).`,
      },
    });

    let receipt = null;
    for (let attempt = 0; attempt < 4 && !receipt; attempt += 1) {
      try {
        receipt = await tx.receipt.upsert({
          where: { orderId: current.orderId },
          // Never overwrite an already-issued receipt.
          update: {},
          create: {
            receiptNumber: generateReceiptNumber(),
            orderId: current.orderId,
            paymentId: current.id,
            totalPaid: current.amount,
            paymentMethod: method,
            transactionReference: current.reference,
          },
        });
      } catch (error) {
        // A rare receipt-number collision retries with a fresh number.
        if (error?.code !== 'P2002' || attempt === 3) throw error;
      }
    }

    const payment = await tx.payment.findUnique({ where: { id: current.id } });
    return { payment, order, receipt, alreadyProcessed: false };
  });
}

export default applyPaymentTransaction;
