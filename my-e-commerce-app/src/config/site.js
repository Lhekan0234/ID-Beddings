// Central site configuration for ID Beddings and More.
//
// IMPORTANT (prd/agent.md section 4): Do NOT invent business contact details,
// address, phone, email, opening hours, or delivery terms. Fields that the owner
// has not yet supplied are intentionally left null/empty and flagged with TODO.

export const site = {
  name: 'ID Beddings and More',
  tagline: "Everything you need for a better night's sleep.",
  currency: 'NGN',
  currencySymbol: '₦',

  // WhatsApp destinations supplied by the owner (prd/agent.md section 4).
  // TODO(owner): Verify each URL opens the intended destination. A catalogue
  // link is not necessarily a direct chat link.
  whatsapp: {
    catalogue: 'https://wa.me/c/2349087201583',
    specialist: 'https://wa.me/c/2348038526476',
    verified: false, // set to true once the owner confirms both destinations
  },

  // Contact details — NOT YET SUPPLIED. Do not fabricate these.
  // TODO(owner): provide real values, then remove the null placeholders.
  contact: {
    phone: null,
    email: null,
    address: null,
    hours: null, // e.g. "Mon–Sun, 9:00–18:00" — obtain actual times before publishing
    note: 'Customer service is available Monday through Sunday. Exact opening and closing times will be published once confirmed by the business owner.',
  },

  // True while the catalogue contains placeholder data rather than real,
  // business-supplied products (prd/agent.md section 5).
  catalogueIsPlaceholder: true,
};

export default site;
