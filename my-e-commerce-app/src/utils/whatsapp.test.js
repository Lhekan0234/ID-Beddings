import site from '../config/site';
import {
  isDirectChatUrl,
  isOwnerSuppliedWhatsappUrl,
  orderEnquiryText,
  whatsappDestinations,
} from './whatsapp';

describe('WhatsApp destinations', () => {
  it('uses exactly the two owner-supplied links from site config', () => {
    expect(site.whatsapp.catalogue).toBe('https://wa.me/c/2349087201583');
    expect(site.whatsapp.specialist).toBe('https://wa.me/c/2348038526476');
    expect(site.whatsapp.verified).toBe(false);
  });

  it('accepts valid wa.me URLs and rejects invented or insecure ones', () => {
    expect(isOwnerSuppliedWhatsappUrl('https://wa.me/c/2349087201583')).toBe(true);
    expect(isOwnerSuppliedWhatsappUrl('https://wa.me/2348038526476')).toBe(true);
    expect(isOwnerSuppliedWhatsappUrl('http://wa.me/c/2349087201583')).toBe(false);
    expect(isOwnerSuppliedWhatsappUrl('https://wa.me/c/abc')).toBe(false);
    expect(isOwnerSuppliedWhatsappUrl('https://example.com/chat')).toBe(false);
    expect(isOwnerSuppliedWhatsappUrl(null)).toBe(false);
  });

  it('does not describe a catalogue link as a direct chat', () => {
    const links = whatsappDestinations();
    expect(links.catalogue.valid).toBe(true);
    expect(links.catalogue.directChat).toBe(false);
    expect(links.specialist.directChat).toBe(false);
    expect(links.verified).toBe(false);
    expect(isDirectChatUrl('https://wa.me/c/2348038526476')).toBe(false);
    expect(isDirectChatUrl('https://wa.me/2348038526476')).toBe(true);
  });

  it('produces enquiry text without fabricating a chat link', () => {
    expect(orderEnquiryText('IDB-20260101-ABCDEF')).toBe(
      'Hello, I would like to ask about my order IDB-20260101-ABCDEF.'
    );
    expect(orderEnquiryText('  IDB-1  ')).toContain('IDB-1');
  });
});
