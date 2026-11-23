import { z } from 'zod';
import { AUDIENCE_VALUES, FIRMNESS_VALUES } from '../services/recommend.js';
import { BUDGET_VALUES } from '../services/pricing.js';

/**
 * Request schemas. Every route validates its body/query/params with these, so
 * malformed or malicious input never reaches the database (prd/agent.md
 * sections 8 and 14).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Deliberately permissive: +234..., 0803..., spaces and dashes. The storefront
// uses the same rule; stored value is the trimmed input.
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .regex(EMAIL_PATTERN, 'Enter a valid email address.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_PATTERN, 'Enter a valid phone number.');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(200, 'Password is too long.');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(200),
});

export const recommendationSchema = z.object({
  audience: z.enum(AUDIENCE_VALUES),
  firmness: z.enum(FIRMNESS_VALUES),
  budget: z.enum(BUDGET_VALUES),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  collection: z.string().trim().max(80).optional(),
  firmness: z.string().trim().max(40).optional(),
  size: z.string().trim().max(40).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['featured', 'price-asc', 'price-desc', 'name-asc', 'newest']).default('featured'),
});

export const collectionParamsSchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export const productParamsSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export const customerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().trim().min(5, 'Enter your delivery address.').max(300),
  state: z.string().trim().min(2, 'Enter your state.').max(100),
  city: z.string().trim().min(1, 'Enter your city or town.').max(100),
  deliveryInstructions: z.string().trim().max(500).optional().default(''),
});

export const cartItemSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  size: z.string().trim().max(50).optional().default(''),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty.').max(50),
  customer: customerSchema,
});

export const trackOrderSchema = z.object({
  reference: z.string().trim().min(4).max(60),
  email: emailSchema,
});

export const orderReferenceParamsSchema = z.object({
  reference: z.string().trim().min(4).max(60),
});

export const orderStatusValues = [
  'ORDER_PLACED',
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
  note: z.string().trim().max(500).optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/* ---------------------------------------------------------------------------
 * Phase 6 — payments and receipts
 * -------------------------------------------------------------------------*/

export const initializePaymentSchema = z.object({
  // The public order reference the customer received at checkout.
  reference: z.string().trim().min(4).max(60),
  email: emailSchema,
});

export const paymentReferenceParamsSchema = z.object({
  reference: z.string().trim().min(4).max(120),
});

export const verifyPaymentQuerySchema = z.object({
  email: emailSchema,
});

export const receiptRequestSchema = z
  .object({
    // Guests prove ownership with the checkout email. Signed-in owners and
    // administrators do not need to send it.
    email: emailSchema.optional(),
  })
  .default({});

/**
 * Administrators confirm a delivery charge before payment can be initialised.
 * Whole Naira only, matching the database's integer money columns.
 */
export const updateDeliverySchema = z.object({
  deliveryFee: z.coerce
    .number()
    .int('Enter the delivery charge in whole Naira.')
    .min(0)
    .max(100_000_000),
});

/* ---------------------------------------------------------------------------
 * Phase 7 — customer records
 * -------------------------------------------------------------------------*/

export const customerSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(120).default(''),
});

export const customerIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

/* ---------------------------------------------------------------------------
 * Phase 8 — admin dashboard and reporting
 * -------------------------------------------------------------------------*/

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a real date.');

export const adminSalesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(120).default(''),
  from: dateString.optional(),
  to: dateString.optional(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'PAY_BY_BANK']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'EXPIRED']).optional(),
});

export const adminProductListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(120).default(''),
  includeArchived: z.enum(['true', 'false']).default('true'),
});

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => /^https?:\/\/\S+$/i.test(value) || value.startsWith('/'),
    'Use an http(s) URL or a path starting with /.' )
  .optional();

const smallList = z.array(z.string().trim().min(1).max(40)).max(30);

const productBase = {
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(3000),
  collectionId: z.string().trim().min(1).max(120),
  price: z.coerce.number().int('Enter the price in whole Naira.').min(0).max(100_000_000),
  currency: z.literal('NGN').default('NGN'),
  sizes: smallList.default([]),
  firmness: smallList.default([]),
  audiences: smallList.default([]),
  stockStatus: z.enum(['In stock', 'Out of stock', 'TBD']).default('TBD'),
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000).nullable().default(null),
  images: z.array(imageUrl).max(20).default([]),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isArchived: z.boolean().default(false),
};

export const adminProductCreateSchema = z.object({
  ...productBase,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphenated slug.')
    .max(160)
    .optional(),
});

export const adminProductUpdateSchema = z
  .object(productBase)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Supply at least one field to update.');

export const adminCollectionCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphenated slug.')
    .max(120),
  description: z.string().trim().max(1000).optional().default(''),
  position: z.coerce.number().int().min(0).max(10000).default(0),
});

export const adminCollectionUpdateSchema = z
  .object(adminCollectionCreateSchema.shape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Supply at least one field to update.');

const optionalWhatsappUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === '' || /^https:\/\/wa\.me\/(?:c\/)?\d{8,15}$/.test(value),
    'Use a valid https://wa.me destination or leave it blank.'
  );

const optionalContactText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .refine(
      (value) => value === null || value === '' || value.length > 1,
      'Leave blank or enter a real value.'
    );

export const adminSettingsSchema = z
  .object({
    contact: z
      .object({
        phone: optionalContactText(60).optional(),
        email: emailSchema.or(z.literal('')).nullable().optional(),
        address: optionalContactText(300).optional(),
      })
      .strict()
      .optional(),
    hours: optionalContactText(200).optional(),
    whatsapp: z
      .object({
        catalogue: optionalWhatsappUrl.optional(),
        specialist: optionalWhatsappUrl.optional(),
      })
      .strict()
      .optional(),
    delivery: z
      .object({
        fee: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
        note: optionalContactText(500).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Supply at least one setting to save.');
