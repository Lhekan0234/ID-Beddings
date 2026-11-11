import { fireEvent, render, screen } from '@testing-library/react';
import Recommendation from './Recommendation';

describe('Recommendation page', () => {
  it('shows an informative empty state when the catalogue cannot match', () => {
    render(<Recommendation />);

    // The placeholder catalogue has no audiences/firmness/prices, so a
    // complete submission must honestly return no matches.
    fireEvent.click(screen.getByLabelText('Adult'));
    fireEvent.click(screen.getByLabelText('Medium'));
    fireEvent.click(screen.getByLabelText('₦100–200k'));
    fireEvent.click(screen.getByRole('button', { name: 'View Matching Options' }));

    expect(
      screen.getByRole('heading', { name: 'No matching mattresses yet' })
    ).toBeInTheDocument();
    expect(screen.getByText(/catalogue is still being finalised/i)).toBeInTheDocument();
  });

  it('links to the mattress specialist on WhatsApp', () => {
    render(<Recommendation />);

    const link = screen.getByRole('link', {
      name: /chat with a mattress specialist on WhatsApp/i,
    });
    expect(link).toHaveAttribute('href', 'https://wa.me/c/2348038526476');
  });
});
