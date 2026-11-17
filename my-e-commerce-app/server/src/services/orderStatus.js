import { ApiError } from '../middleware/errors.js';

/**
 * Fulfilment status rules for Phase 7 (prd/agent.md sections 11 and 16).
 *
 * These are admin-controlled, manual status updates. Nothing here claims live
 * GPS tracking: we only expose the timestamps and notes the administrator
 * actually recorded.
 */

export const ORDER_STATUS_FLOW = [
  'ORDER_PLACED',
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const ORDER_STATUS_META = {
  ORDER_PLACED: {
    label: 'Order placed',
    description: 'We have received your order. Delivery and payment are being confirmed.',
  },
  PAYMENT_CONFIRMED: {
    label: 'Payment confirmed',
    description: 'Your payment has been verified with the payment provider.',
  },
  PROCESSING: {
    label: 'Processing',
    description: 'Your order is being prepared.',
  },
  DISPATCHED: {
    label: 'Dispatched',
    description: 'Your order has left us. Check the tracking notes for details.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    description: 'Your order is on its way. Check the tracking notes for details.',
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been marked as delivered.',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'This order was cancelled. Contact us if you think this is a mistake.',
  },
};

/** PAYMENT_CONFIRMED is set only by the verified payment flow (Phase 6). */
const ALLOWED_TRANSITIONS = {
  ORDER_PLACED: ['CANCELLED'],
  PAYMENT_CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrder(currentStatus, nextStatus) {
  return (ALLOWED_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

/**
 * Reject impossible or dishonest fulfilment changes before they reach the DB.
 *
 * @param {{currentStatus: string, paymentStatus: string, nextStatus: string, note?: string}} input
 */
export function assertValidOrderStatusUpdate({
  currentStatus,
  paymentStatus,
  nextStatus,
  note,
}) {
  if (nextStatus === 'PAYMENT_CONFIRMED') {
    throw new ApiError(
      409,
      'Payment confirmation is recorded only after the payment provider verifies a transaction.'
    );
  }
  if (nextStatus === currentStatus) {
    throw new ApiError(409, 'The order already has that status.');
  }
  if (nextStatus !== 'CANCELLED' && paymentStatus !== 'PAID') {
    throw new ApiError(
      409,
      'Fulfilment can only be updated after payment has been verified.'
    );
  }
  if (!canTransitionOrder(currentStatus, nextStatus)) {
    throw new ApiError(
      409,
      `An order at "${ORDER_STATUS_META[currentStatus]?.label || currentStatus}" cannot move to "${ORDER_STATUS_META[nextStatus]?.label || nextStatus}".`
    );
  }
  if (
    (nextStatus === 'DISPATCHED' || nextStatus === 'OUT_FOR_DELIVERY') &&
    !String(note || '').trim()
  ) {
    throw new ApiError(
      400,
      'Add a tracking note (for example the courier or delivery details) before marking an order as dispatched.'
    );
  }
}

/**
 * Turn recorded events into a customer-facing timeline. Missing steps are
 * simply unreached; no dates or delivery promises are invented.
 */
export function buildTrackingTimeline(order) {
  const events = Array.isArray(order?.events) ? order.events : [];
  const currentStatus = order?.status || 'ORDER_PLACED';

  const steps = ORDER_STATUS_FLOW.map((status) => {
    const matching = events.filter((event) => event.status === status);
    const latest = matching[matching.length - 1] || null;
    const reached = Boolean(latest) || currentStatus === status;

    return {
      status,
      label: ORDER_STATUS_META[status].label,
      description: ORDER_STATUS_META[status].description,
      reached,
      current: currentStatus === status,
      at: latest?.createdAt ? new Date(latest.createdAt).toISOString() : null,
    };
  });

  const cancellationEvent = [...events]
    .reverse()
    .find((event) => event.status === 'CANCELLED');

  return {
    currentStatus,
    currentLabel: ORDER_STATUS_META[currentStatus]?.label || currentStatus,
    steps,
    cancellation:
      currentStatus === 'CANCELLED'
        ? {
            label: ORDER_STATUS_META.CANCELLED.label,
            description: ORDER_STATUS_META.CANCELLED.description,
            at: cancellationEvent?.createdAt
              ? new Date(cancellationEvent.createdAt).toISOString()
              : null,
          }
        : null,
    notes: events
      .filter((event) => String(event.note || '').trim())
      .map((event) => ({
        status: event.status || null,
        label: ORDER_STATUS_META[event.status]?.label || 'Update',
        note: String(event.note).trim(),
        at: event.createdAt ? new Date(event.createdAt).toISOString() : null,
      })),
    // Explicitly false so clients cannot mistake this for live courier tracking.
    isLiveGps: false,
    note: 'Delivery progress is updated manually by our team. This is not live GPS tracking.',
  };
}
