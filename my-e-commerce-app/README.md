# ID Beddings and More - E-commerce Website

A professional, secure, responsive React e-commerce storefront and admin
dashboard for **ID Beddings and More**, a bedding and mattress retailer.
Currency: **Nigerian Naira (NGN)**. Landing headline: *"Everything you need for
a better night's sleep."*

Product requirements, business rules and phases live in
[`prd/agent.md`](prd/agent.md). Follow that file throughout development.

## Current Status: Phase 5 - backend & database complete

Phases 1–5 are implemented and tested: the storefront (home, collections,
catalogue, search/filter/sort, product detail), the mattress recommendation
form, the shopping cart + checkout interface, and the Express/Prisma/PostgreSQL
backend with server-side pricing, authentication and order records.

**The catalogue still contains clearly-labelled placeholder products** because
the owner has not yet supplied real product data, prices, images, sizes,
firmness or stock levels. Nothing has been invented: unknown values display as
"To be confirmed" / "Price TBD". The business contact details, delivery charges
and customer-service hours are also still marked `[PENDING]`.

Phase 6 (payment integration & receipts) is the next phase. It must not be
treated as live until the Paystack merchant account is configured and verified.

### Backend at a glance

```bash
cd server
cp .env.example .env      # set JWT_SECRET; ADMIN_* optional
npm install
npm run db:up             # PostgreSQL 16 via Docker
npm run prisma:generate
npm run migrate
npm run seed
npm run dev               # http://localhost:5000
```

See [`server/README.md`](server/README.md) for the endpoint list and security
decisions. Requirements: **64-bit Node.js**. This development machine's
32-bit Node cannot load Prisma's library engine, so the backend was verified
with a portable 64-bit Node build.

## Proposed architecture

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React 19 + Create React App (`react-scripts` 5.0.1) + React Router | Reuse existing stack; add routing in Phase 2. |
| Styling | Plain CSS design system | Reusable components + design tokens. |
| Backend | Node + Express REST API | Added in Phase 5. |
| Database | PostgreSQL via Prisma ORM | Relational; built-in migrations. |
| Auth | Email/password, httpOnly JWT cookies, roles `admin`/`customer` | Server-side authorization on every protected endpoint. |
| Payments | Paystack (test mode until merchant account verified) | Cards, bank transfer, pay-by-bank. |
| Images | Cloudinary | Reliable image storage; no hotlinking. |
| Validation | `zod` (client + server) | Server-side validation required. |

### Planned folder structure (grows over the phases)

```text
my-e-commerce-app/
  prd/agent.md          # requirements & rules (source of truth)
  server/               # Express API + Prisma (added in Phase 5)
    routes/ controllers/ middleware/
    prisma/             # schema.prisma + migrations
    .env.example
  public/
  src/                  # React client
    components/         # reusable UI (Nav, Footer, ProductCard, ...)
    pages/              # Home, Collections, ProductDetail, Cart, Admin/*, ...
    context/            # Cart + Auth state
    data/ or api/       # client API calls
```

## Environment Variables

Copy `.env.example` to `.env` and fill in real values locally. Real `.env` files
are git-ignored and must never be committed. Values marked `[PENDING]` must be
provided by the business owner (they are intentionally blank - no secrets or
invented data are stored in this repo).

The backend has its own [`server/.env.example`](server/.env.example):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs session cookies; use a long random value |
| `PORT` / `CLIENT_ORIGIN` | API port and allowed storefront origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional; seeds an administrator account |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Phase 6, presently blank |

## Roadmap (phases from `prd/agent.md`)

1. ✅ **Phase 1 - Audit & Architecture** (documented in this README)
2. ✅ **Phase 2 - Storefront, catalogue & collections**
3. ✅ **Phase 3 - Mattress recommendation form**
4. ✅ **Phase 4 - Shopping cart & checkout interface**
5. ✅ **Phase 5 - Backend & database** (Express + Prisma + PostgreSQL, auth, server-side pricing, order records)
6. ⏭ **Phase 6 - Payment integration & receipts** (next)
7. Phase 7 - Customer records, WhatsApp & delivery tracking
8. Phase 8 - Admin dashboard & sales reporting
9. Phase 9 - Security review, testing & deployment

### Implemented routes

| Route | Page |
| --- | --- |
| `/` | Home (hero, collections, new arrivals) |
| `/collections` | Collections overview |
| `/collections/:collectionSlug` | Collection detail with search/filter/sort |
| `/shop` | Full catalogue with search/filter/sort |
| `/products/:productId` | Product detail and add-to-cart |
| `/find-your-mattress` | Mattress recommendation form and matching results |
| `/cart` | Shopping cart (quantity updates, removal, totals) |
| `/checkout` | Delivery details, validation and order review (the review is a draft; no order is submitted yet) |
| `/contact` | Contact and WhatsApp support |

Cart contents are cached in `localStorage` **only** as a convenience for the
shopper. Customer records, orders and payments live in the server-side database
(prd/agent.md section 12).

## Tests

```bash
# Storefront (71 tests across 9 suites)
npm test -- --watchAll=false

# Backend (45 tests across 12 suites; database tests need PostgreSQL)
cd server && npm test
```

The backend suite includes unit tests for pricing, recommendations, order
references and validation, plus integration tests that exercise the API against
the seeded database. When PostgreSQL is unreachable the integration tests skip
themselves and the unit tests still run.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode. Open http://localhost:3000 to view it in the
browser. The page reloads when you make changes, and you may see lint errors in
the console.

### `npm test`

Launches the test runner in interactive watch mode. See the Create React App
documentation on running tests for more information.

### `npm run build`

Builds the app for production to the `build` folder. It correctly bundles React
in production mode and optimizes the build for the best performance. The build
is minified and the filenames include the hashes.

See the Create React App deployment documentation for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you cannot go back.** It
copies all configuration into the project for full control. We do NOT plan to
eject.

## Learn More

- Create React App documentation: https://create-react-app.dev
- React documentation: https://react.dev
