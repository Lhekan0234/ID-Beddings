import { fireEvent, render, screen } from '@testing-library/react';
import RecommendationForm from './RecommendationForm';

function answerQuestion(label) {
  fireEvent.click(screen.getByLabelText(label));
}

describe('RecommendationForm', () => {
  it('renders every required question and the submit label', () => {
    render(<RecommendationForm onSubmit={jest.fn()} />);

    expect(screen.getByText('Who is it for?')).toBeInTheDocument();
    expect(screen.getByText('Preferred firmness?')).toBeInTheDocument();
    expect(screen.getByText('Budget?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Matching Options' })
    ).toBeInTheDocument();

    ['Adult', 'Child', 'Couple', 'Guest room'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    ['Soft', 'Medium', 'Firm', 'Orthopedic'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    ['Under ₦100k', '₦100–200k', '₦200–400k', 'Premium'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it('asks for all answers before submitting', () => {
    const onSubmit = jest.fn();
    render(<RecommendationForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'View Matching Options' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/answer all three questions/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the selected answers', () => {
    const onSubmit = jest.fn();
    render(<RecommendationForm onSubmit={onSubmit} />);

    answerQuestion('Couple');
    answerQuestion('Medium');
    answerQuestion('₦200–400k');
    fireEvent.click(screen.getByRole('button', { name: 'View Matching Options' }));

    expect(onSubmit).toHaveBeenCalledWith({
      audience: 'couple',
      firmness: 'Medium',
      budget: '200-400k',
    });
  });
});
