import { useState } from 'react';
import { firmnessOptions } from '../../data/products';
import {
  AUDIENCE_OPTIONS,
  BUDGET_OPTIONS,
  isRecommendationComplete,
} from '../../utils/recommend';
import Button from '../ui/Button';
import './RecommendationForm.css';

const emptyAnswers = { audience: '', firmness: '', budget: '' };

/**
 * Mattress recommendation form (prd/agent.md section 7).
 * Three required questions, each rendered as an accessible radio group.
 * The selections are passed to `onSubmit` so the page can query the real
 * catalogue (see utils/recommend.js).
 */
export default function RecommendationForm({ onSubmit }) {
  const [answers, setAnswers] = useState(emptyAnswers);
  const [error, setError] = useState('');

  const complete = isRecommendationComplete(answers);

  const update = (field) => (event) => {
    setAnswers((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!complete) {
      setError('Please answer all three questions so we can find matching mattresses.');
      return;
    }
    setError('');
    onSubmit(answers);
  };

  return (
    <form className="recommendation-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="recommendation-form__group">
        <legend className="recommendation-form__legend">Who is it for?</legend>
        <div className="recommendation-form__options">
          {AUDIENCE_OPTIONS.map((option) => (
            <label key={option.value} className="recommendation-form__option">
              <input
                type="radio"
                name="audience"
                value={option.value}
                checked={answers.audience === option.value}
                onChange={update('audience')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="recommendation-form__group">
        <legend className="recommendation-form__legend">Preferred firmness?</legend>
        <div className="recommendation-form__options">
          {firmnessOptions.map((firmness) => (
            <label key={firmness} className="recommendation-form__option">
              <input
                type="radio"
                name="firmness"
                value={firmness}
                checked={answers.firmness === firmness}
                onChange={update('firmness')}
              />
              <span>{firmness}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="recommendation-form__group">
        <legend className="recommendation-form__legend">Budget?</legend>
        <div className="recommendation-form__options">
          {BUDGET_OPTIONS.map((option) => (
            <label key={option.value} className="recommendation-form__option">
              <input
                type="radio"
                name="budget"
                value={option.value}
                checked={answers.budget === option.value}
                onChange={update('budget')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="recommendation-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg">
        View Matching Options
      </Button>
    </form>
  );
}
