import site from '../config/site';

/**
 * WhatsApp hand-off (prd/agent.md section 4 and Phase 7).
 *
 * The owner supplied two `wa.me/c/...` catalogue links. Those are catalogue
 * destinations, not necessarily direct chats, so we never advertise them as a
 * guaranteed chat. Until the owner confirms the destinations, the UI keeps the
 * "pending verification" notice.
 */

const WA_ME_URL = /^https:\/\/wa\.me\/(?:c\/)?\d{8,15}$/;

/** Exact guidance shown wherever the catalogue has nothing to display. */
export const WHATSAPP_MORE_INFO_MESSAGE = 'contact the whatsapp number for more information';

export function isOwnerSuppliedWhatsappUrl(url) {
  return typeof url === 'string' && WA_ME_URL.test(url);
}

/** Catalogue URLs contain `/c/` and must not be described as direct chat. */
export function isDirectChatUrl(url) {
  return typeof url === 'string' && /^https:\/\/wa\.me\/\d{8,15}$/.test(url);
}

export function whatsappDestinations() {
  return {
    catalogue: {
      url: site.whatsapp.catalogue,
      valid: isOwnerSuppliedWhatsappUrl(site.whatsapp.catalogue),
      directChat: isDirectChatUrl(site.whatsapp.catalogue),
    },
    specialist: {
      url: site.whatsapp.specialist,
      valid: isOwnerSuppliedWhatsappUrl(site.whatsapp.specialist),
      directChat: isDirectChatUrl(site.whatsapp.specialist),
    },
    verified: Boolean(site.whatsapp.verified),
  };
}

/** Prefilled text for the customer to paste — we never open an invented chat URL. */
export function orderEnquiryText(reference) {
  return `Hello, I would like to ask about my order ${String(reference || '').trim()}.`;
}
