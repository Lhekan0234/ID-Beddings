import { WHATSAPP_MORE_INFO_MESSAGE, whatsappDestinations } from '../../utils/whatsapp';
import './WhatsAppMoreInfo.css';

/**
 * Honest WhatsApp guidance for empty catalogue/collection states.
 *
 * The owner supplied two `wa.me/c/` catalogue destinations. They are shown as
 * catalogue links only; we do not claim a direct chat or verified destination.
 */
export default function WhatsAppMoreInfo({ compact = false }) {
  const links = whatsappDestinations();
  const className = [
    'whatsapp-more-info',
    compact ? 'whatsapp-more-info--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} role="note">
      <p className="whatsapp-more-info__message">{WHATSAPP_MORE_INFO_MESSAGE}</p>

      <div className="whatsapp-more-info__links">
        {links.catalogue.valid ? (
          <a href={links.catalogue.url} target="_blank" rel="noopener noreferrer">
            Business catalogue
          </a>
        ) : null}
        {links.specialist.valid ? (
          <a href={links.specialist.url} target="_blank" rel="noopener noreferrer">
            Mattress catalogue
          </a>
        ) : null}
      </div>

      {!links.verified ? (
        <p className="whatsapp-more-info__pending">
          Owner-supplied catalogue destinations; direct chat is not confirmed.
        </p>
      ) : null}
    </div>
  );
}
