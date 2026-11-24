import { render, screen } from '@testing-library/react';
import WhatsAppMoreInfo from './WhatsAppMoreInfo';
import site from '../../config/site';

describe('WhatsAppMoreInfo', () => {
  it('shows the exact owner guidance and both supplied catalogue links', () => {
    render(<WhatsAppMoreInfo />);

    expect(
      screen.getByText('contact the whatsapp number for more information')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Business catalogue' })).toHaveAttribute(
      'href',
      site.whatsapp.catalogue
    );
    expect(screen.getByRole('link', { name: 'Mattress catalogue' })).toHaveAttribute(
      'href',
      site.whatsapp.specialist
    );
  });

  it('does not present the catalogue links as a confirmed direct chat', () => {
    render(<WhatsAppMoreInfo />);

    expect(screen.getByText(/direct chat is not confirmed/i)).toBeInTheDocument();
  });
});
