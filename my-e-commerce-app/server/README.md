# ID Beddings and More — Backend API (Phases 5–8)

Express REST API with PostgreSQL (via Prisma) that owns the product catalogue,
server-side pricing, order records, customer records, authentication, Paystack
payments and PDF receipts.

The React storefront and this API share the owner-supplied catalogue in
`src/data/ownerCatalogue.mjs` (124 priced rows, 14 bed lines), so prices cannot
drift between them. Checkout, payment verification, receipts, customer accounts,
order tracking and the protected admin dashboard call this API.

## Quick start

```bash
cd server
cp .env.example .env          # then set JWT_SECRET and (optionally) ADMIN_*
npm install
npm run db:up                 # local PostgreSQL 16 in Docker
npm run prisma:generate
npm run migrate               # create the database schema
npm run seed                  # 7 collections + 124 owner-priced products + 14 illustrative images
npm run dev                   # http://localhost:5000
```

Run the tests with:

```bash
npm test
```

The suite has 109 tests across 31 suites: pricing, recommendations, references,
validation, webhook signatures, payment helpers, order status transitions,
verified-revenue and CSV safety, and API integration tests including customer
access, secure tracking, protected admin reporting/catalogue/settings and a
complete initialise → verify → receipt → replay flow against a mocked Paystack
client. Database-backed tests skip themselves automatically when PostgreSQL is
not reachable, so `npm test` still works without Docker. Test files run one at a
time (`--test-concurrency=1`) because the integration tests create temporary
catalogue records that would otherwise skew catalogue-count tests.

Prisma's default query engine requires a **64-bit Node.js** installation.

## API endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Liveness check |
| `POST` | `/api/auth/register` | Public | Create a customer account (role is always `CUSTOMER`) |
| `POST` | `/api/auth/login` | Public | Sign in; sets an httpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie |
| `GET` | `/api/auth/me` | Signed in | Current user |
| `GET` | `/api/products` | Public | Search (`q`), filter (`collection`, `firmness`, `size`, `inStock`) and sort |
| `GET` | `/api/products/:id` | Public | Product by id or slug |
| `GET` | `/api/collections` | Public | Seven collections with live product counts |
| `GET` | `/api/collections/:slug` | Public | Collection plus its non-archived products |
| `POST` | `/api/recommendations` | Public | Mattress matching from `{audience, firmness, budget}` |
| `POST` | `/api/orders` | Public (guest checkout) | Recalculates all prices server-side; records an unpaid order |
| `POST` | `/api/orders/track` | Public (reference + email) | Secure order lookup |
| `GET` | `/api/orders` | Signed in | Customer's own orders; admins see all (paginated) |
| `GET` | `/api/orders/:reference` | Owner or admin | Single order |
| `PATCH` | `/api/orders/:reference/delivery` | Admin | Confirm the delivery charge (required before payment) |
| `PATCH` | `/api/orders/:reference/status` | Admin | Fulfilment status + tracking note |
| `POST` | `/api/orders/:reference/receipt` | Owner, admin or guest with checkout email | Download the PDF receipt (paid orders only) |
| `POST` | `/api/payments/initialize` | Guest (order reference + email) | Create a payment attempt; returns Paystack's hosted checkout URL |
| `GET` | `/api/payments/verify/:reference?email=` | Guest (payment reference + email) | Verify with Paystack, validate amount/currency, settle the order |
| `POST` | `/api/payments/webhook` | Paystack (signature required) | Idempotent charge notifications |
| `GET` | `/api/customers/me` | Signed in | Own saved customer record (or `null`) |
| `GET` | `/api/customers/me/orders` | Signed in | Own persistent order history (paginated) |
| `GET` | `/api/customers?q=&page=&pageSize=` | Admin | Search customer records |
| `GET` | `/api/customers/:id` | Admin | Customer record with full order history |
| `GET` | `/api/admin/overview` | Admin | Real-DB revenue, order/customer counts and recent verified payments |
| `GET` | `/api/admin/sales` | Admin | Searchable/filterable payment records and verified revenue |
| `GET` | `/api/admin/sales/export.csv` | Admin | CSV export with escaped cells and formula neutralisation |
| `GET` | `/api/admin/products` | Admin | Product management list (includes archived) |
| `POST` | `/api/admin/products` | Admin | Add a product with images, prices, sizes and stock |
| `PATCH` | `/api/admin/products/:id` | Admin | Update prices, stock, images, flags and archive state |
| `GET` | `/api/admin/collections` | Admin | All collections with product counts |
| `POST` | `/api/admin/collections` | Admin | Add a collection |
| `PATCH` | `/api/admin/collections/:id` | Admin | Rename or reorder a collection |
| `GET` | `/api/admin/settings` | Admin | Owner-supplied business settings with blank defaults |
| `PUT` | `/api/admin/settings` | Admin | Save contact, hours, WhatsApp links and delivery config |

## Security decisions

- Passwords hashed with bcrypt (cost 12); no password is ever returned.
- JWT stored in an `httpOnly`, `SameSite=Lax` cookie; `Secure` in production.
- Roles are re-read from the database on every authenticated request, so a
  customer cannot grant themselves admin by editing a token.
- Every body/query is validated with zod; errors return field-level details.
- Order totals are recalculated from database prices; browser totals are never
  trusted.
- Order references use `node:crypto` randomness and are checked for collisions.
- Order tracking requires both the reference and the checkout email and returns
  the same generic 404 for a wrong pair, so references cannot be enumerated.
- `PAYMENT_CONFIRMED` cannot be set manually; only a verified payment (Phase 6)
  may set it.
- Payments are initialised server-side for the database order total; the browser
  never supplies an amount.
- A payment is settled only after Paystack's verify endpoint (or a
  signature-verified webhook) reports success, with matching reference, amount
  (in kobo) and currency.
- Webhooks are checked against `PAYSTACK_WEBHOOK_SECRET` (timestamped
  `Paystack-Signature`) or, when that is not configured, the legacy
  `x-paystack-signature` HMAC. Raw body bytes are used and comparisons are
  constant-time.
- Webhook retries and repeated browser verifications are idempotent: a payment
  can move to `PAID` once, and only one receipt can exist per order.
- Receipts are PDFs generated on demand and are only available for verified
  payments. Guests must supply the checkout email; mismatches return the same
  generic 404 as order tracking.
- No card number, CVV or other raw card data is ever received or stored.
- Customer records are linked to an account by `userId` or matching email on
  register/sign-in; no profile is invented at registration.
- Customer endpoints verify ownership or admin role on every request and return
  only safe fields (no password hash, no other customer's id).
- Status transitions are server-enforced: payment cannot be confirmed manually,
  fulfilment cannot start before verified payment, notes are required for
  dispatch stages, and cancelled/delivered orders are terminal.
- Tracking responses include recorded notes only and explicitly set
  `isLiveGps: false`; no GPS or delivery promise is claimed.
- **Every admin endpoint is protected on the server** with `authenticate` and
  `requireAdmin`; hiding the React `/admin` link is not an access control.
- Verified revenue is computed only from payments whose status is `PAID`;
  pending, failed and expired attempts are never reported as sales.
- CSV exports escape quotes/commas/newlines and prefix formula-like cells with
  an apostrophe so spreadsheets cannot execute them.
- The WhatsApp `verified` flag is not writable through the settings API; only
  the owner can confirm a destination outside the dashboard.

## Deliberate Phase 8 limitations

- **Live payment needs merchant credentials.** Without
  `PAYSTACK_SECRET_KEY`, `/api/payments/initialize` returns a clear 503. The
  payment flow was verified with a mocked Paystack client; no live transaction
  has been made. Test and live keys must never be mixed.
- **Delivery must be confirmed first.** `deliveryFee` is `null` and
  `requiresDeliveryQuote: true` until an administrator calls
  `PATCH /api/orders/:reference/delivery`. Payment is refused before then so an
  incomplete total is never charged.
- **Catalogue data is real but incomplete.** Prices, labels and sizes come from
  the owner's price list. Stock stays `TBD`, most firmness/audience values are
  unknown, and the images are labelled illustrations rather than photos.
  Recommendations only match where the owner actually supplied the needed data;
  most adult/medium queries therefore return no matches rather than a guess.
  Cut-off FIRM dimensions are preserved with `...` and MONDEO SPRING FIRM was
  omitted entirely because its prices were not visible.
- **Admin data is as good as the records entered.** The dashboard reports real
  database rows only; an empty report means no matching record, never invented
  sales. Owner-supplied contact details stay blank until saved in Settings.
- **Guest access uses reference + email.** Receipt downloads and payment
  verification require the checkout email in addition to the reference. Rate
  limiting and abuse monitoring belong to Phase 9.
- **Webhooks need a public HTTPS URL.** Add
  `https://<your-api-host>/api/payments/webhook` in the Paystack dashboard and
  set `PAYSTACK_WEBHOOK_SECRET`. Localhost cannot receive webhooks.
- **Receipts remain download-only.** No email or WhatsApp delivery provider is
  configured, so no notification is claimed to have been sent. The tracking page
  lets the customer copy an enquiry to paste into a verified channel.
- **WhatsApp destinations are unconfirmed.** The supplied links were checked on
  2026-11-17 and open catalogue views, not direct chats; the owner must confirm
  which business and destination each link represents.
- **No retention policy is automated yet.** Customer records are stored in
  PostgreSQL with access controls; a deletion/retention schedule must be agreed
  with the owner before launch (Phase 9).
- **No delivery or notification integration.** Admin status notes are manual;
  no courier API or message provider is configured, so no delivery promise or
  sent notification is claimed.
