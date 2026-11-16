# ID Beddings and More — Backend API (Phase 5)

Express REST API with PostgreSQL (via Prisma) that owns the product catalogue,
server-side pricing, order records, customer records and authentication.

The React storefront currently still reads its placeholder catalogue from
`src/data/products.js`; wiring those pages to this API happens as real data and
the remaining phases land.

## Quick start

```bash
cd server
cp .env.example .env          # then set JWT_SECRET and (optionally) ADMIN_*
npm install
npm run db:up                 # local PostgreSQL 16 in Docker
npm run prisma:generate
npm run migrate               # create the database schema
npm run seed                  # 7 collections + 8 placeholder products
npm run dev                   # http://localhost:5000
```

Run the tests with:

```bash
npm test
```

Database-backed tests skip themselves automatically when PostgreSQL is not
reachable, so `npm test` still works without Docker. Unit tests for pricing,
recommendations, references and validation always run.

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
| `PATCH` | `/api/orders/:reference/status` | Admin | Fulfilment status + tracking note |

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

## Deliberate Phase 5 limitations

- **No payment is taken.** Orders are created with `paymentStatus: PENDING`.
  Paystack integration, webhooks and receipts belong to Phase 6.
- **Delivery is not priced.** `deliveryFee` is `null` and
  `requiresDeliveryQuote: true` until the owner supplies charges or rules.
- **The catalogue is placeholder data.** Products have no price, sizes,
  firmness, audiences, images or stock, so recommendations honestly return no
  matches and orders for those products are rejected until real data is added.
- **No admin UI yet.** The admin API exists behind role checks; the dashboard is
  Phase 8.
- **No rate limiting yet.** Add it at the edge or in Phase 9 together with the
  rest of the security review.
