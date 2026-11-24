# ID Beddings and More - E-commerce Website

A professional, secure, responsive React e-commerce storefront and admin
dashboard for **ID Beddings and More**, a bedding and mattress retailer.
Currency: **Nigerian Naira (NGN)**. Landing headline: *"Everything you need for
a better night's sleep."*

Product requirements, business rules and phases live in
[`prd/agent.md`](prd/agent.md). Follow that file throughout development.

## Current Status: Phase 8 - protected admin dashboard & sales reporting complete

Phases 1–8 are implemented: the storefront, the mattress recommendation form,
the cart + checkout, the Express/Prisma/PostgreSQL backend, Paystack payment
initialisation, server-side verification, webhook handling and PDF receipts,
customer accounts, secure order tracking, enforced fulfilment status transitions,
and a protected admin dashboard with sales reporting and catalogue management.

**The catalogue now uses the owner's real price list (124 size/price rows across
14 bed lines), transcribed from the price sheet supplied on 2026-11-24.** The
raw transcription lives in `src/data/ownerCatalogue.mjs` and is shared with the
backend seed so the API and storefront cannot drift. Each size is its own
product because the owner quotes a different unit price per size.

The owner's own groups are kept as `tier` badges: **LUXURY** (33 rows),
**COMFORT** (66) and **VALUE** (25). Products are placed into the seven existing
collections using the bed names and price bands: Budget Sleep holds COMFY,
MOUKA KIDDIES and BABY MATTRESS; Better Sleep holds FLORA, SUPER FLORA and FLORA
PREMIER; Orthopedic Collection holds MONDEO SPRING PLUS and PILLOW TOP ROYAL
FIRM; Luxury Sleep holds the WELLBEING ranges, PILLOW TOP ROYAL and TOPPER;
Hotel Collection holds the GOLDY hospital mattress. The two bundle collections
remain empty because no bundle products were supplied.

**Still not supplied, therefore not invented:** stock levels (all `TBD`), real
product photographs, firmness for most lines, adult/guest-room audiences,
new-arrival or best-seller claims, and the cut-off dimensions of PILLOW TOP
ROYAL FIRM (`75X54X...` etc. are preserved exactly). The local SVGs in
`public/images/beds/` are explicitly labelled *illustrative only — not a
product photo*; regenerate them with `node scripts/generate-bed-illustrations.mjs`.

**Live payments are not enabled.** The flow is complete and tested against a
mocked Paystack client, but it needs the owner's Paystack keys, a confirmed
delivery charge per order, and a public HTTPS webhook URL before a real payment
can be taken. Test and live keys must never be mixed.

**WhatsApp links are still pending owner confirmation.** Both supplied URLs were
checked on 2026-11-17: they open catalogue views ("Ogunsusi Enterprise" and
"Marvel Madeen Homes and Properties"), not confirmed direct chats. The UI
therefore labels them as catalogue destinations and does not promise a chat or
send notifications through them.

**The admin area is protected on the server.** Every `/api/admin/*` endpoint
requires an authenticated administrator; hiding the `/admin` link is not the
security boundary. Verified revenue is calculated only from `PAID` payments, and
CSV exports escape cells and neutralise spreadsheet formulas. The WhatsApp
`verified` flag cannot be changed through the API.

Phase 9 (security review, testing and deployment) is the next phase.

### Backend at a glance

```bash
cd server
cp .env.example .env      # set JWT_SECRET, PAYSTACK_* and ADMIN_* as needed
npm install
npm run db:up             # PostgreSQL 16 via Docker
npm run prisma:generate
npm run migrate
npm run seed
npm run dev               # http://localhost:5000
```

Set `PAYSTACK_WEBHOOK_SECRET` and add
`https://<your-api-host>/api/payments/webhook` in the Paystack dashboard before
testing live webhooks. The storefront reads the API URL from
`REACT_APP_API_URL` (see `.env.example`).

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
  server/               # Express API + Prisma (Phases 5–6)
    src/routes/ src/middleware/ src/services/
    prisma/             # schema.prisma + migrations + seed
    tests/
    .env.example
  public/
  src/                  # React client
    api/                # storefront API client
    components/         # reusable UI (Nav, Footer, ProductCard, ...)
    pages/              # Home, Collections, ProductDetail, Cart, Admin/*, ...
    context/            # Cart + Auth state
    data/               # placeholder catalogue until real data is supplied
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
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Paystack credentials (server-side only) |
| `PAYSTACK_WEBHOOK_SECRET` | `whsec_...` signing secret for webhook verification |
| `PAYMENT_CALLBACK_URL` | Where Paystack returns the customer (defaults to `/payment/callback`) |

The storefront reads one variable:

| Variable | Purpose |
| --- | --- |
| `REACT_APP_API_URL` | API base URL (default `http://localhost:5000/api`) |

## Roadmap (phases from `prd/agent.md`)

1. ✅ **Phase 1 - Audit & Architecture** (documented in this README)
2. ✅ **Phase 2 - Storefront, catalogue & collections**
3. ✅ **Phase 3 - Mattress recommendation form**
4. ✅ **Phase 4 - Shopping cart & checkout interface**
5. ✅ **Phase 5 - Backend & database** (Express + Prisma + PostgreSQL, auth, server-side pricing, order records)
6. ✅ **Phase 6 - Payment integration & receipts** (Paystack init/verify, signed idempotent webhooks, PDF receipts; live keys required)
7. ✅ **Phase 7 - Customer records, WhatsApp & delivery tracking** (no GPS claims; links pending owner confirmation)
8. ✅ **Phase 8 - Admin dashboard & sales reporting** (server-side access control; real-DB figures)
9. ⏭ **Phase 9 - Security review, testing & deployment** (next)

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
| `/checkout` | Delivery details, server-priced order and Paystack checkout |
| `/payment/callback` | Verifies the payment with the server, shows status and downloads the receipt |
| `/track` | Secure order tracking with reference + checkout email, recorded notes and receipts |
| `/account` | Sign in / register, saved customer details and persistent order history |
| `/admin` | Protected admin dashboard: Overview, Sales, Products, Orders, Customers, Settings |
| `/contact` | Contact and WhatsApp support |

Cart contents are cached in `localStorage` **only** as a convenience for the
shopper. Customer records, orders and payments live in the server-side database
(prd/agent.md section 12).

## Tests

```bash
# Storefront (106 tests across 15 suites)
npx react-scripts test --watchAll=false --runInBand

# Backend (109 tests across 31 suites; DB-backed tests skip without PostgreSQL)
cd server && npm test
```

Latest verification: storefront **106/106 passed**; backend **75 passed, 34
skipped, 0 failed** (the skipped tests require PostgreSQL); production build
compiled successfully with all 14 illustrative SVGs copied to `build/images/beds/`.

The storefront tests cover the catalogue, recommendations, cart, checkout
validation, the API client, the server-verified payment callback, secure order
tracking, customer accounts, WhatsApp link handling and admin access control.

The backend suite includes unit tests for pricing, recommendations, order and
payment references, validation, webhook signatures, status transitions and safe
CSV/verified-revenue reporting, plus integration tests for the API, customer
records/tracking, protected admin endpoints and a complete initialise → verify →
receipt → replay payment flow against a mocked Paystack client. When PostgreSQL
is unreachable the integration tests skip themselves and the unit tests still
run.

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
