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
