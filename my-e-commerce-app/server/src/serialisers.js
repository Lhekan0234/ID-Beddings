/**
 * Convert database records into the JSON shapes the storefront consumes.
 * Keeping this in one place avoids leaking database fields (password hashes,
 * internal ids for other customers, etc.) through the API.
 */
import { buildTrackingTimeline } from './services/orderStatus.js';

/** Customer details safe to return to the owner or an administrator. */
export function serialiseCustomer(customer, { orderCount } = {}) {
  if (!customer) return null;
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    state: customer.state,
    city: customer.city,
    createdAt: customer.createdAt,
    orderCount: typeof orderCount === 'number' ? orderCount : undefined,
  };
}

export function serialiseUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || null,
    role: user.role,
  };
}

export function serialiseCollection(collection) {
  if (!collection) return null;
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description || null,
    position: collection.position ?? 0,
    productCount:
      typeof collection._count?.products === 'number'
        ? collection._count.products
        : undefined,
  };
}

export function serialiseProduct(product) {
  if (!product) return null;

  const images = Array.isArray(product.images)
    ? product.images
        .map((image) => (typeof image === 'string' ? image : image?.url))
        .filter(Boolean)
    : [];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    collection: product.collection?.slug || product.collectionId,
    collectionName: product.collection?.name || null,
    price: product.price ?? null,
    currency: product.currency || 'NGN',
    images,
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    firmness: Array.isArray(product.firmness) ? product.firmness : [],
    audiences: Array.isArray(product.audiences) ? product.audiences : [],
    stockStatus: product.stockStatus || 'TBD',
    stockQuantity: product.stockQuantity ?? null,
    specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
    isPlaceholder: Boolean(product.isPlaceholder),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    isArchived: Boolean(product.isArchived),
    dateAdded: product.dateAdded
      ? new Date(product.dateAdded).toISOString().slice(0, 10)
      : null,
  };
}

export function serialisePayment(payment) {
  if (!payment) return null;
  return {
    reference: payment.reference,
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method || null,
    channel: payment.channel || null,
    paidAt: payment.paidAt || null,
    verifiedAt: payment.verifiedAt || null,
    failureReason: payment.failureReason || null,
  };
}

export function serialiseOrder(order) {
  if (!order) return null;

  const customer = order.customer
    ? {
        fullName: order.customer.fullName,
        email: order.customer.email,
        phone: order.customer.phone,
        address: order.customer.address,
        state: order.customer.state,
        city: order.customer.city,
      }
    : null;

  return {
    reference: order.reference,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || null,
    currency: order.currency || 'NGN',
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee ?? null,
    total: order.total,
    requiresDeliveryQuote: Boolean(order.requiresDeliveryQuote),
    deliveryInstructions: order.deliveryInstructions || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          productId: item.productId,
          name: item.nameSnapshot,
          size: item.size || null,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        }))
      : [],
    events: Array.isArray(order.events)
      ? order.events.map((event) => ({
          status: event.status || null,
          note: event.note,
          createdAt: event.createdAt,
        }))
      : [],
    tracking: buildTrackingTimeline(order),
  };
}
