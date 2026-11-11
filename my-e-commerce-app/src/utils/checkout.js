// =============================================================================
// Checkout form validation (prd/agent.md section 8)
// =============================================================================
// These checks give the customer immediate feedback. They are NOT a substitute
// for server-side validation: from Phase 5 the API must re-validate every field
// and recalculate all prices and totals (prd/agent.md section 8).
// =============================================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Deliberately permissive: allows +234..., 0803..., spaces and dashes.
// Final normalisation happens on the server.
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;

export const CHECKOUT_FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
  { name: 'address', label: 'Delivery address', autoComplete: 'street-address' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'city', label: 'City or town', autoComplete: 'address-level2' },
];

export const emptyCheckoutValues = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  state: '',
  city: '',
  deliveryInstructions: '',
};

/**
 * Validate checkout values and return a map of field -> error message.
 * An empty object means the form is valid.
 */
export function validateCheckout(values = {}) {
  const errors = {};
  const trimmed = (name) => String(values[name] || '').trim();

  CHECKOUT_FIELDS.forEach(({ name, label }) => {
    if (!trimmed(name)) errors[name] = `${label} is required.`;
  });

  if (trimmed('email') && !EMAIL_PATTERN.test(trimmed('email'))) {
    errors.email = 'Enter a valid email address.';
  }

  if (trimmed('phone') && !PHONE_PATTERN.test(trimmed('phone'))) {
    errors.phone = 'Enter a valid phone number (7–15 digits, optionally starting with +).';
  }

  if (trimmed('deliveryInstructions') && trimmed('deliveryInstructions').length > 500) {
    errors.deliveryInstructions = 'Delivery instructions must be 500 characters or fewer.';
  }

  return errors;
}
