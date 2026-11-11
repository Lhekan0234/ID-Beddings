# ID Beddings and More - E-commerce Website

A professional, secure, responsive React e-commerce storefront and admin
dashboard for **ID Beddings and More**, a bedding and mattress retailer.
Currency: **Nigerian Naira (NGN)**. Landing headline: *"Everything you need for
a better night's sleep."*

Product requirements, business rules and phases live in
[`prd/agent.md`](prd/agent.md). Follow that file throughout development.

## Current Status: Phase 4 - cart & checkout interface complete

Phases 1–4 are implemented and tested: the storefront (home, collections,
catalogue, search/filter/sort, product detail), the mattress recommendation
form, and the shopping cart + checkout interface.

**The catalogue still contains clearly-labelled placeholder products** because
the owner has not yet supplied real product data, prices, images, sizes,
firmness or stock levels. Nothing has been invented: unknown values display as
"To be confirmed" / "Price TBD". The business contact details, delivery charges
and customer-service hours are also still marked `[PENDING]`.

Phase 5 (backend, database and server-side totals) is the next phase. Payment
integration (Phase 6) must not be treated as live until the merchant account is
configured and verified.

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

## Roadmap (phases from `prd/agent.md`)

1. ✅ **Phase 1 - Audit & Architecture** (documented in this README)
2. ✅ **Phase 2 - Storefront, catalogue & collections**
3. ✅ **Phase 3 - Mattress recommendation form**
4. ✅ **Phase 4 - Shopping cart & checkout interface**
5. ⏭ **Phase 5 - Backend & database** (next)
6. Phase 6 - Payment integration & receipts
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
| `/checkout` | Delivery details, validation and order review (no order is created yet) |
| `/contact` | Contact and WhatsApp support |

Cart contents are cached in `localStorage` **only** as a convenience for the
shopper. Customer records, orders and payments must live in the server-side
database from Phase 5 (prd/agent.md section 12).

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
