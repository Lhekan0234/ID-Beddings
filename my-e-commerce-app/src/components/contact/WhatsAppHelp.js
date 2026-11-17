import { useState } from 'react';
import Button from '../ui/Button';
import { orderEnquiryText, whatsappDestinations } from '../../utils/whatsapp';
import './WhatsAppHelp.css';

/**
 * Owner-supplied WhatsApp destinations with an honest verification notice.
 * A `wa.me/c/` link is presented as a catalogue destination, not a direct chat.
 */
export default function WhatsAppHelp({ reference }) {
  const links = whatsappDestinations();
  const [copied, setCopied] = useState(false);

  const copyEnquiry = async () => {
    if (!reference || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(orderEnquiryText(reference));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="whatsapp-help" aria-labelledby="whatsapp-help-title">
      <h2 id="whatsapp-help-title">Need help with an order?</h2>
      <p>
        Browse the WhatsApp catalogue or open the mattress specialist destination
        supplied by the business owner.
      </p>

      <div className="whatsapp-help__actions">
        <Button href={links.catalogue.url} variant="primary">
          View catalogue on WhatsApp
        </Button>
        <Button href={links.specialist.url} variant="secondary">
          View supplied mattress catalogue
        </Button>
        {reference ? (
          <Button type="button" variant="secondary" onClick={copyEnquiry}>
            Copy order enquiry text
          </Button>
        ) : null}
      </div>

      {reference ? (
        <p className="whatsapp-help__hint" role="status">
          {copied
            ? 'Enquiry text copied. Paste it into your WhatsApp message.'
            : `Your order reference is ${reference}. Keep it handy if you contact us.`}
        </p>
      ) : null}

      {!links.verified ? (
        <p className="whatsapp-help__pending">
          These WhatsApp destinations are pending verification by the business
          owner. They are catalogue links and are not presented as a guaranteed
          direct chat.
        </p>
      ) : null}
    </section>
  );
}
