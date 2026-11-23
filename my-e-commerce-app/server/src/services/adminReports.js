/**
 * Admin reporting helpers (prd/agent.md section 13, Phase 8).
 *
 * Every figure here is derived from database records. Verified revenue counts
 * only payments the server already confirmed with Paystack; pending, failed and
 * expired attempts are never presented as sales.
 */

export function buildSalesWhere(filters = {}) {
  const { q, from, to, paymentMethod, paymentStatus } = filters;
  const where = {};

  if (paymentMethod) where.method = paymentMethod;
  if (paymentStatus) where.status = paymentStatus;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { order: { reference: { contains: q, mode: 'insensitive' } } },
      { order: { customer: { email: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

/** Flatten a Payment + order/customer record for the dashboard tables. */
export function serialiseTransaction(payment) {
  return {
    reference: payment.reference,
    orderReference: payment.order?.reference || null,
    customerEmail: payment.order?.customer?.email || null,
    status: payment.status,
    method: payment.method || null,
    channel: payment.channel || null,
    amount: payment.amount,
    currency: payment.currency,
    createdAt: payment.createdAt
      ? new Date(payment.createdAt).toISOString()
      : null,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
  };
}

/** Revenue is a sum of verified payments only. */
export function verifiedRevenue(transactions) {
  return transactions
    .filter((transaction) => transaction.status === 'PAID')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
}

export const CSV_COLUMNS = [
  ['Payment reference', 'reference'],
  ['Order reference', 'orderReference'],
  ['Customer email', 'customerEmail'],
  ['Status', 'status'],
  ['Payment method', 'method'],
  ['Amount (NGN)', 'amount'],
  ['Currency', 'currency'],
  ['Created at', 'createdAt'],
  ['Paid at', 'paidAt'],
];

/** Escape CSV cells and neutralise spreadsheet formula injection. */
export function escapeCsvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function transactionsToCsv(transactions) {
  const header = CSV_COLUMNS.map(([label]) => escapeCsvCell(label)).join(',');
  const rows = transactions.map((transaction) =>
    CSV_COLUMNS.map(([, key]) => escapeCsvCell(transaction[key])).join(',')
  );
  return [header, ...rows].join('\r\n') + '\r\n';
}
