import { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  CHECKOUT_FIELDS,
  emptyCheckoutValues,
  validateCheckout,
} from '../utils/checkout';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import OrderSummary from '../components/cart/OrderSummary';
import './Checkout.css';

/**
 * Checkout interface (prd/agent.md section 8, Phase 4).
 *
 * Collects the required delivery details and validates them in the browser.
 * No order is created and no payment is taken: order creation, server-side
 * re-validation and payment belong to Phases 5–6, so the review step is
 * explicitly labelled as a draft rather than pretending an order exists.
 */
export default function Checkout() {
  const { items, subtotal, hasUnknownPrices } = useCart();
  const [values, setValues] = useState(emptyCheckoutValues);
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(null);

  const update = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateCheckout(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = CHECKOUT_FIELDS.find((field) => nextErrors[field.name]);
      if (firstInvalid) {
        document.getElementById(`checkout-${firstInvalid.name}`)?.focus();
      }
      return;
    }

    setReview({ values: { ...values } });
  };

  if (items.length === 0) {
    return (
      <div className="container page">
        <header className="page__header">
          <h1>Checkout</h1>
        </header>
        <EmptyState
          title="Your cart is empty"
          message="Add a product to your cart before checking out."
          action={<Button to="/collections">Shop collections</Button>}
        />
      </div>
    );
  }

  if (review) {
    return (
      <div className="container page checkout">
        <header className="page__header">
          <h1>Review your order</h1>
          <p className="text-muted">
            Check your details before continuing. Nothing has been charged.
          </p>
        </header>

        <div className="checkout-layout">
          <section className="checkout__card" aria-labelledby="review-details-heading">
            <h2 id="review-details-heading">Delivery details</h2>
            <dl className="checkout__review">
              <div><dt>Name</dt><dd>{review.values.fullName}</dd></div>
              <div><dt>Email</dt><dd>{review.values.email}</dd></div>
              <div><dt>Phone</dt><dd>{review.values.phone}</dd></div>
              <div><dt>Address</dt><dd>{review.values.address}</dd></div>
              <div><dt>City</dt><dd>{review.values.city}</dd></div>
              <div><dt>State</dt><dd>{review.values.state}</dd></div>
              {review.values.deliveryInstructions ? (
                <div>
                  <dt>Delivery instructions</dt>
                  <dd>{review.values.deliveryInstructions}</dd>
                </div>
              ) : null}
            </dl>

            <div className="checkout__notice" role="note">
              <strong>Draft order — not submitted.</strong> Order creation and
              secure payment will be enabled once the backend (Phase 5) and
              payment gateway (Phase 6) are connected. No payment has been
              requested and no order reference exists yet.
            </div>

            <div className="checkout__actions">
              <Button type="button" variant="secondary" onClick={() => setReview(null)}>
                Edit details
              </Button>
              <Button to="/cart" variant="secondary">
                Back to cart
              </Button>
            </div>
          </section>

          <OrderSummary
            items={items}
            subtotal={subtotal}
            hasUnknownPrices={hasUnknownPrices}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container page checkout">
      <header className="page__header">
        <h1>Checkout</h1>
        <p className="text-muted">
          Enter your delivery details. Payment is requested only after your
          order and prices are verified.
        </p>
      </header>

      <div className="checkout-layout">
        <form className="checkout__form" onSubmit={handleSubmit} noValidate>
          {CHECKOUT_FIELDS.map((field) => {
            const error = errors[field.name];
            const errorId = `checkout-${field.name}-error`;

            return (
              <div className="checkout__field" key={field.name}>
                <label htmlFor={`checkout-${field.name}`}>
                  {field.label}
                  <span aria-hidden="true" className="checkout__required"> *</span>
                </label>
                <input
                  id={`checkout-${field.name}`}
                  name={field.name}
                  type={field.type || 'text'}
                  autoComplete={field.autoComplete}
                  value={values[field.name]}
                  onChange={update(field.name)}
                  aria-required="true"
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
                {error ? (
                  <p className="checkout__error" id={errorId}>
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}

          <div className="checkout__field checkout__field--full">
            <label htmlFor="checkout-deliveryInstructions">
              Delivery instructions <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="checkout-deliveryInstructions"
              name="deliveryInstructions"
              rows="3"
              value={values.deliveryInstructions}
              onChange={update('deliveryInstructions')}
              aria-invalid={errors.deliveryInstructions ? 'true' : undefined}
              aria-describedby={
                errors.deliveryInstructions
                  ? 'checkout-deliveryInstructions-error'
                  : undefined
              }
            />
            {errors.deliveryInstructions ? (
              <p className="checkout__error" id="checkout-deliveryInstructions-error">
                {errors.deliveryInstructions}
              </p>
            ) : null}
          </div>

          <div className="checkout__field checkout__field--full">
            <Button type="submit" variant="primary" size="lg">
              Continue to review
            </Button>
            <p className="checkout__server-note">
              Final prices, stock and delivery charges will be recalculated and
              verified on the server before payment.
            </p>
          </div>
        </form>

        <OrderSummary
          items={items}
          subtotal={subtotal}
          hasUnknownPrices={hasUnknownPrices}
        />
      </div>
    </div>
  );
}
