import site from '../config/site';
import Button from '../components/ui/Button';
import './Contact.css';

export default function Contact() {
  const { contact, whatsapp } = site;

  return (
    <div className="container page">
      <header className="page__header">
        <h1>Contact &amp; support</h1>
        <p className="text-muted">
          We're here to help you choose the right mattress and bedding.
        </p>
      </header>

      <div className="contact">
        <section className="contact__card">
          <h2>Chat with us on WhatsApp</h2>
          <p>
            Browse the full product catalogue or speak with a mattress specialist.
          </p>
          <div className="contact__actions">
            <Button href={whatsapp.catalogue} variant="primary">View main catalogue on WhatsApp</Button>
            <Button href={whatsapp.specialist} variant="secondary">View supplied catalogue link</Button>
          </div>
          {!whatsapp.verified && (
            <p className="contact__pending">
              WhatsApp links are pending verification by the business owner.
            </p>
          )}
        </section>

        <section className="contact__card">
          <h2>Customer service</h2>
          {contact.hours ? (
            <p>{contact.hours}</p>
          ) : (
            <p className="text-muted">{contact.note}</p>
          )}

          <ul className="contact__details">
            <li>
              <span className="contact__label">Phone</span>
              <span>{contact.phone || 'To be provided'}</span>
            </li>
            <li>
              <span className="contact__label">Email</span>
              <span>{contact.email || 'To be provided'}</span>
            </li>
            <li>
              <span className="contact__label">Address</span>
              <span>{contact.address || 'To be provided'}</span>
            </li>
          </ul>

          <p className="contact__pending">
            Contact details will be published once confirmed by the business owner.
          </p>
        </section>
      </div>
    </div>
  );
}
