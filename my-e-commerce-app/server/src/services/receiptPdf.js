import PDFDocument from 'pdfkit';

/**
 * Downloadable PDF receipt (prd/agent.md section 10).
 *
 * Only generated for a payment the server has verified. Business contact
 * details are deliberately not printed because the owner has not supplied
 * verified contact information yet — inventing them is forbidden.
 */

const PAGE_MARGIN = 50;

const PAYMENT_METHOD_LABELS = {
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  PAY_BY_BANK: 'Pay by bank',
};

const naira = (amount) =>
  `NGN ${Number(amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
  }
}

function rule(doc) {
  doc.moveDown(0.4);
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .stroke();
  doc.moveDown(0.6);
}

/**
 * Build the receipt as a Buffer.
 *
 * @param {{order: object, payment: object, receipt: object}} input
 * @returns {Promise<Buffer>}
 */
export function buildReceiptPdf({ order, payment, receipt }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const customer = order.customer || {};

    doc.font('Helvetica-Bold').fontSize(20).text('ID BEDDINGS AND MORE');
    doc.font('Helvetica').fontSize(13).text('Payment receipt');
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#555555').text('Issued automatically after server-side payment verification.');
    doc.fillColor('#000000');

    rule(doc);

    doc.font('Helvetica-Bold').fontSize(11).text('Receipt details');
    doc.font('Helvetica').fontSize(10);
    doc.moveDown(0.3);

    const details = [
      ['Receipt number', receipt.receiptNumber],
      ['Order reference', order.reference],
      ['Issued', formatDate(receipt.issuedAt)],
      ['Payment status', 'Paid'],
      ['Payment method', PAYMENT_METHOD_LABELS[receipt.paymentMethod] || payment?.channel || '—'],
      ['Transaction reference', receipt.transactionReference],
    ];

    details.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(String(value || '—'));
    });

    doc.moveDown(0.8);
    ensureSpace(doc, 80);
    doc.font('Helvetica-Bold').fontSize(11).text('Billed to');
    doc.font('Helvetica').fontSize(10);
    doc.moveDown(0.3);
    [
      customer.fullName,
      customer.email,
      customer.phone,
      customer.address,
      [customer.city, customer.state].filter(Boolean).join(', '),
    ]
      .filter(Boolean)
      .forEach((line) => doc.text(String(line)));

    doc.moveDown(0.8);
    ensureSpace(doc, 60);
    doc.font('Helvetica-Bold').fontSize(11).text('Items purchased');
    doc.moveDown(0.3);

    const columns = {
      name: PAGE_MARGIN,
      quantity: PAGE_MARGIN + 300,
      unit: PAGE_MARGIN + 370,
      total: PAGE_MARGIN + 450,
    };

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Item', columns.name, doc.y, { width: 290, continued: false });
    const headerY = doc.y - 12;
    doc.text('Qty', columns.quantity, headerY, { width: 50 });
    doc.text('Unit price', columns.unit, headerY, { width: 80 });
    doc.text('Amount', columns.total, headerY, { width: 90, align: 'right' });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    (order.items || []).forEach((item) => {
      ensureSpace(doc, 30);
      const label = item.size ? `${item.nameSnapshot} (${item.size})` : item.nameSnapshot;
      const rowY = doc.y;
      doc.text(label, columns.name, rowY, { width: 290 });
      const rowHeight = Math.max(doc.y - rowY, 12);
      doc.text(String(item.quantity), columns.quantity, rowY, { width: 50 });
      doc.text(naira(item.unitPrice), columns.unit, rowY, { width: 80 });
      doc.text(naira(item.lineTotal), columns.total, rowY, { width: 90, align: 'right' });
      doc.y = rowY + rowHeight;
      doc.moveDown(0.15);
    });

    doc.moveDown(0.5);
    rule(doc);

    const totals = [
      ['Subtotal', naira(order.subtotal)],
      ['Delivery', order.deliveryFee === null || order.deliveryFee === undefined ? 'To be confirmed' : naira(order.deliveryFee)],
      ['Total paid', naira(receipt.totalPaid)],
    ];

    const totalsX = PAGE_MARGIN + 300;
    totals.forEach(([label, value], index) => {
      const isTotal = index === totals.length - 1;
      doc
        .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isTotal ? 11 : 10)
        .text(label, totalsX, doc.y, { width: 100 })
        .text(value, totalsX + 110, doc.y - doc.currentLineHeight(), {
          width: 90,
          align: 'right',
        });
      doc.moveDown(0.2);
    });

    doc.moveDown(1);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text(
        'This receipt confirms a payment verified on the server with the payment provider. ' +
          'No card details are stored by ID Beddings and More.',
        PAGE_MARGIN,
        doc.y,
        { width: doc.page.width - PAGE_MARGIN * 2 }
      );

    doc.end();
  });
}

export default buildReceiptPdf;
