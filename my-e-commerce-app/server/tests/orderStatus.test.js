import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORDER_STATUS_FLOW,
  assertValidOrderStatusUpdate,
  buildTrackingTimeline,
  canTransitionOrder,
} from '../src/services/orderStatus.js';

const paid = {
  paymentStatus: 'PAID',
  currentStatus: 'PAYMENT_CONFIRMED',
  nextStatus: 'PROCESSING',
};

describe('canTransitionOrder', () => {
  it('allows the documented forward fulfilment steps', () => {
    assert.equal(canTransitionOrder('PAYMENT_CONFIRMED', 'PROCESSING'), true);
    assert.equal(canTransitionOrder('PROCESSING', 'DISPATCHED'), true);
    assert.equal(canTransitionOrder('DISPATCHED', 'OUT_FOR_DELIVERY'), true);
    assert.equal(canTransitionOrder('OUT_FOR_DELIVERY', 'DELIVERED'), true);
  });

  it('allows cancellation while an order is still active', () => {
    assert.equal(canTransitionOrder('ORDER_PLACED', 'CANCELLED'), true);
    assert.equal(canTransitionOrder('PROCESSING', 'CANCELLED'), true);
  });

  it('rejects skipped, backwards and terminal transitions', () => {
    assert.equal(canTransitionOrder('ORDER_PLACED', 'DELIVERED'), false);
    assert.equal(canTransitionOrder('PAYMENT_CONFIRMED', 'PAYMENT_CONFIRMED'), false);
    assert.equal(canTransitionOrder('DELIVERED', 'PROCESSING'), false);
    assert.equal(canTransitionOrder('CANCELLED', 'PROCESSING'), false);
  });
});

describe('assertValidOrderStatusUpdate', () => {
  it('accepts a valid paid-order update', () => {
    assert.doesNotThrow(() => assertValidOrderStatusUpdate(paid));
  });

  it('never allows a manual payment confirmation', () => {
    assert.throws(
      () => assertValidOrderStatusUpdate({ ...paid, nextStatus: 'PAYMENT_CONFIRMED' }),
      /provider verifies/i
    );
  });

  it('refuses fulfilment before payment is verified', () => {
    assert.throws(
      () =>
        assertValidOrderStatusUpdate({
          ...paid,
          currentStatus: 'ORDER_PLACED',
          paymentStatus: 'PENDING',
        }),
      /after payment has been verified/i
    );
  });

  it('requires a tracking note for dispatch stages', () => {
    assert.throws(
      () => assertValidOrderStatusUpdate({ ...paid, currentStatus: 'PROCESSING', nextStatus: 'DISPATCHED' }),
      /tracking note/i
    );
    assert.throws(
      () =>
        assertValidOrderStatusUpdate({
          ...paid,
          currentStatus: 'DISPATCHED',
          nextStatus: 'OUT_FOR_DELIVERY',
          note: '   ',
        }),
      /tracking note/i
    );
    assert.doesNotThrow(() =>
      assertValidOrderStatusUpdate({
        ...paid,
        currentStatus: 'PROCESSING',
        nextStatus: 'DISPATCHED',
        note: 'Handed to courier',
      })
    );
  });
});

describe('buildTrackingTimeline', () => {
  const at = '2026-02-03T10:00:00.000Z';
  const order = {
    status: 'DISPATCHED',
    events: [
      { status: 'ORDER_PLACED', note: 'Order placed.', createdAt: at },
      { status: 'PAYMENT_CONFIRMED', note: 'Payment verified.', createdAt: at },
      { status: 'PROCESSING', note: 'Being prepared.', createdAt: at },
      { status: 'DISPATCHED', note: 'Handed to courier.', createdAt: at },
    ],
  };

  it('lists all six documented steps in order and marks reached ones', () => {
    const timeline = buildTrackingTimeline(order);
    assert.deepEqual(
      timeline.steps.map((step) => step.status),
      ORDER_STATUS_FLOW
    );
    assert.equal(timeline.steps.filter((step) => step.reached).length, 4);
    assert.equal(timeline.steps[3].current, true);
    assert.equal(timeline.steps[4].reached, false);
    assert.equal(timeline.steps[5].at, null);
  });

  it('includes only real notes and explicitly denies live GPS tracking', () => {
    const timeline = buildTrackingTimeline(order);
    assert.equal(timeline.notes.length, 4);
    assert.equal(timeline.notes[3].note, 'Handed to courier.');
    assert.equal(timeline.isLiveGps, false);
    assert.match(timeline.note, /not live GPS/i);
  });

  it('shows cancellation separately instead of pretending delivery happened', () => {
    const timeline = buildTrackingTimeline({
      status: 'CANCELLED',
      events: [{ status: 'CANCELLED', note: 'Customer cancelled.', createdAt: at }],
    });
    assert.equal(timeline.cancellation.label, 'Cancelled');
    assert.equal(timeline.cancellation.at, at);
    assert.equal(timeline.steps.some((step) => step.current), false);
  });

  it('handles a missing event history without inventing dates', () => {
    const timeline = buildTrackingTimeline({ status: 'ORDER_PLACED' });
    assert.equal(timeline.steps[0].reached, true);
    assert.equal(timeline.steps[0].at, null);
    assert.deepEqual(timeline.notes, []);
  });
});
