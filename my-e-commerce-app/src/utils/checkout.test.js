import { emptyCheckoutValues, validateCheckout } from './checkout';

describe('validateCheckout', () => {
  const valid = {
    ...emptyCheckoutValues,
    fullName: 'Ada Obi',
    email: 'ada@example.com',
    phone: '0803 123 4567',
    address: '12 Example Street',
    state: 'Lagos',
    city: 'Ikeja',
  };

  it('accepts a complete, well-formed set of details', () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it('requires every core field', () => {
    const errors = validateCheckout({});
    expect(Object.keys(errors).sort()).toEqual(
      ['address', 'city', 'email', 'fullName', 'phone', 'state'].sort()
    );
  });

  it('rejects malformed email addresses', () => {
    expect(validateCheckout({ ...valid, email: 'ada@' }).email).toMatch(
      /valid email/i
    );
  });

  it('accepts Nigerian phone formats with spaces or a plus prefix', () => {
    expect(validateCheckout({ ...valid, phone: '+2348031234567' }).phone).toBeUndefined();
    expect(validateCheckout({ ...valid, phone: '08031234567' }).phone).toBeUndefined();
  });

  it('rejects a phone number that is too short or contains letters', () => {
    expect(validateCheckout({ ...valid, phone: '123' }).phone).toMatch(
      /valid phone/i
    );
    expect(validateCheckout({ ...valid, phone: 'call me maybe' }).phone).toMatch(
      /valid phone/i
    );
  });

  it('limits delivery instructions to 500 characters', () => {
    expect(
      validateCheckout({ ...valid, deliveryInstructions: 'x'.repeat(501) })
        .deliveryInstructions
    ).toMatch(/500 characters/i);
  });
});
