# ID Beddings and More — Cline Project Instructions

## 1. Project Overview

Build a professional, secure, responsive React e-commerce website for **ID Beddings and More**, a bedding and mattress retail business.

The website must support customers browsing products, receiving mattress recommendations, purchasing products, making payments, obtaining receipts, contacting customer service and tracking deliveries.

It must also provide a secure admin dashboard for managing products, customers, orders, payments and sales records.

## 2. Development Rules

Before making changes:

1. Inspect the existing project structure and understand the current implementation.
2. Identify the framework, dependencies, routing, styling, backend and database.
3. Preserve working features and reuse existing components where appropriate.
4. Explain significant architectural changes before implementing them.
5. Work in small, testable phases.
6. Do not replace the entire project without approval.
7. Do not invent products, prices, customer records or sales figures.
8. Do not declare a feature complete until it has been tested.
9. Report modified files, completed work, test results and remaining issues.
10. Ask for clarification when an essential business requirement is unknown.

## 3. Git and Backup Safety

Before significant changes:

1. Verify the Git repository root using `git rev-parse --show-toplevel`.
2. Confirm that the repository root is the actual project folder.
3. Never initialise or use Git from `C:\Users\HP` for this project.
4. Never stage personal Windows files, unrelated projects, credentials or environment secrets.
5. Check `git status` and review changes before staging files.
6. Create meaningful commits after working milestones have been tested.
7. Never delete or overwrite existing Git history without explicit approval.
8. Never use destructive Git commands without explaining the consequences and receiving approval.
9. Preserve a separate backup before major migrations or risky changes.

## 4. Business Information

Business name: ID Beddings and More.

Currency: Nigerian naira (NGN).

Landing page headline:

"Everything you need for a better night's sleep."

Product catalogue reference:

https://wa.me/c/2349087201583

Mattress specialist WhatsApp destination supplied by the owner:

https://wa.me/c/2348038526476

Verify that each WhatsApp URL opens the intended destination. A catalogue link is not necessarily a direct chat link.

Customer service availability: Monday through Sunday. Obtain the actual opening and closing times before publishing them.

Do not invent a business address, phone number, delivery promise or return policy.

## 5. Product Collections

Implement these seven collections:

1. Budget Sleep
2. Better Sleep
3. Orthopedic Collection
4. Luxury Sleep
5. Hotel Collection
6. New Home Bundle
7. Couples Bundle

Each product should support an ID, name, description, price, collection, images, available sizes, firmness, stock status and relevant specifications.

Use real business-supplied product data. Mark missing data for the owner to provide.

Product images must be stored or referenced using a reliable image-storage approach. Do not hotlink private or temporary images.

## 6. Storefront

Implement:

- Responsive homepage.
- Navigation and footer.
- Product search and filters.
- Product collection pages.
- Product detail pages.
- Product sorting.
- Best sellers and new arrivals.
- Shopping cart.
- Customer account features where required.
- Contact and support information.
- Loading, error and empty states.
- Accessible forms and navigation.

Use consistent branding, typography, spacing and product photography.

## 7. Mattress Recommendation Form

Add a prominent button labelled:

"Which mattress is right for me?"

Required questions:

Who is it for?
- Adult
- Child
- Couple
- Guest room

Preferred firmness?
- Soft
- Medium
- Firm
- Orthopedic

Budget?
- Under ₦100k
- ₦100–200k
- ₦200–400k
- Premium

Provide a Submit button labelled "View Matching Options".

The submitted selections must be used to query the real product catalogue.

Return products matching the selected budget, firmness and intended use where the necessary product data exists.

Display product images, actual prices, relevant specifications and links to product details.

Provide an informative empty state when there are no matches.

Never fabricate product availability or claim that a product has a medical benefit without reliable supporting information.

Below the form, display:

"Not sure which mattress to buy? Chat with a mattress specialist on WhatsApp."

Link to the supplied WhatsApp destination.

## 8. Shopping Cart and Checkout

Shopping cart functionality:

- Add products.
- Remove products.
- Update quantities.
- Validate inventory.
- Calculate totals.
- Preserve the cart appropriately.
- Display an empty-cart state.

Checkout must collect:

- Customer name.
- Email address.
- Phone number.
- Delivery address.
- State and city.
- Delivery instructions where applicable.

Show products, quantities, subtotal, delivery charges and total before payment.

Recalculate prices and totals on the server. Never trust totals supplied by the browser.

## 9. Payment Gateway

Support these requested payment methods:

- Debit and credit cards.
- Bank transfer.
- Pay-by-bank where supported by the selected provider and merchant account.

Evaluate a suitable payment gateway for Nigerian businesses, such as Paystack or Flutterwave.

Use the selected provider's current official documentation.

Requirements:

- Initialise payments on the backend.
- Store secret credentials only in server-side environment variables.
- Verify transaction status on the server.
- Validate amount, currency, transaction reference and order association.
- Verify webhook signatures.
- Handle repeated webhook events safely.
- Prevent duplicate payment processing.
- Handle successful, pending, failed and expired payments.
- Never treat a browser redirect as proof of payment.
- Never store raw card numbers or CVVs.
- Clearly separate test and live environments.

Do not enable live payment processing until the owner has configured and verified the merchant account.

## 10. Receipts

Generate a downloadable PDF receipt after payment has been verified.

The receipt must include:

- ID Beddings and More.
- Unique receipt number.
- Order number.
- Customer information.
- Transaction date.
- Purchased products.
- Quantities and prices.
- Subtotal.
- Delivery charge.
- Total paid.
- Payment method.
- Transaction reference.
- Payment status.

Store receipt references in the database and allow authorised administrators to retrieve them.

For unconfirmed transfers, show a pending-payment acknowledgement rather than a paid receipt.

## 11. Order Management and Delivery Tracking

Every order must have a unique order reference.

Implement the following order statuses:

1. Order Placed
2. Payment Confirmed
3. Processing
4. Dispatched
5. Out for Delivery
6. Delivered

Allow authorised administrators to update fulfilment status and add tracking notes.

Customers must be able to check their own orders securely.

Provide order notifications through configured and supported communication channels.

Do not claim to provide live GPS tracking unless a real delivery provider integration supports it.

## 12. Customer Database

Maintain customer records and order history using a persistent database.

Use appropriate validation, unique identifiers and relationships.

Protect customer names, addresses, email addresses, phone numbers and purchase history.

Apply appropriate retention, privacy and access policies.

Do not use browser localStorage as the production database for customer records, payments or orders.

## 13. Admin Dashboard

Create a protected admin dashboard with the following sections:

### Overview
- Verified sales revenue.
- Total orders.
- Pending orders.
- Customer count.
- Recent transactions.

### Sales
- Search and filter records.
- Date-range reports.
- Payment method and status filters.
- Transaction references.
- CSV exports.

### Products
- Add and edit products.
- Manage collections.
- Update prices and stock.
- Manage product images.
- Archive products.

### Orders
- View order details.
- Review payment status.
- Update fulfilment and delivery statuses.
- Retrieve receipts.

### Customers
- Search customer records.
- View customer details and order history.
- Restrict access to authorised users.

### Settings
- Business contact details.
- Customer service hours.
- WhatsApp destinations.
- Delivery configuration.

Protect every administrative API endpoint on the server.

Do not rely solely on hiding admin links in the frontend.

Customers must not be able to grant themselves administrative permissions.

All dashboard statistics must come from real database records.

## 14. Architecture and Code Quality

Inspect the existing architecture before selecting technologies.

Reuse the current React stack if suitable.

If a backend or database is missing, propose an appropriate solution and explain the trade-offs before implementing it.

Use:

- Reusable components.
- Clear separation of concerns.
- Server-side validation.
- Consistent error handling.
- Secure authentication and authorisation.
- Database migrations.
- Environment variable documentation.
- Automated tests where appropriate.

Keep credentials out of source control.

Maintain a `.gitignore` that excludes dependencies, build output, local secrets and other generated files.

Never commit real API keys or customer data.

## 15. Implementation Phases

Work through these phases in order:

Phase 1: Project audit and architecture.

Phase 2: Storefront, catalogue and collections.

Phase 3: Mattress recommendation form.

Phase 4: Shopping cart and checkout interface.

Phase 5: Backend and database.

Phase 6: Payment integration and receipts.

Phase 7: Customer records, WhatsApp and delivery tracking.

Phase 8: Admin dashboard and sales reporting.

Phase 9: Security review, testing and deployment.

Do not implement everything in one unreviewed batch.

At the end of each phase:

1. Summarise completed features.
2. List changed files.
3. Run appropriate tests and builds.
4. Report failures honestly.
5. Identify configuration still required.
6. Wait for approval before major changes to the next phase.

## 16. Definition of Done

The project is ready for launch only when:

- The product catalogue contains verified business data.
- The recommendation form returns genuine matching products.
- Cart and checkout calculations are correct.
- Payment verification works server-side.
- Paid receipts are issued only for verified payments.
- Order and inventory updates are consistent.
- Customers can access only their authorised information.
- Admin routes and APIs are protected.
- Sales reports reflect actual verified transactions.
- WhatsApp links lead to the intended destination.
- Responsive layouts and core customer journeys have been tested.
- Production secrets are securely configured.
- Deployment, backup and maintenance instructions are documented.

Never report a feature as complete merely because its interface has been created.