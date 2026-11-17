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
  // Checked 2026-11-17: the first URL opens the "Ogunsusi Enterprise" catalogue
  // and the second opens the "Marvel Madeen Homes and Properties" catalogue.
  // Both are catalogue views, not confirmed direct chats, and the second title
  // does not by itself confirm the "mattress specialist" label. The owner must
  // confirm the intended destinations before `verified` is set to true.
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

  // Delivery configuration (prd/agent.md section 13 "Delivery configuration").
  // TODO(owner): supply real delivery charges or rules. Until then we show
  // "To be confirmed" rather than inventing a fee or delivery promise.
  delivery: {
    fee: null,
    note: 'Delivery charges are confirmed by our team before payment.',
  },

  // True while the catalogue contains placeholder data rather than real,
  // business-supplied products (prd/agent.md section 5).
  catalogueIsPlaceholder: true,
};

export default site;
