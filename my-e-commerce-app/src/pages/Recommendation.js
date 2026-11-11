import { useState } from 'react';
import { products } from '../data/products';
import { recommendProducts } from '../utils/recommend';
import RecommendationForm from '../components/recommendation/RecommendationForm';
import RecommendationResults from '../components/recommendation/RecommendationResults';
import site from '../config/site';
import './Recommendation.css';

/**
 * "Which mattress is right for me?" page (prd/agent.md section 7).
 * The form answers are used to query the real product catalogue; results are
 * only shown once the customer submits a complete set of answers.
 */
export default function Recommendation() {
  const [submission, setSubmission] = useState(null);

  const handleSubmit = (answers) => {
    setSubmission({ answers, matches: recommendProducts(products, answers) });
  };

  return (
    <div className="container page recommendation">
      <header className="page__header">
        <h1>Which mattress is right for me?</h1>
        <p className="text-muted">
          Answer three quick questions and we'll show mattresses that match your
          needs and budget.
        </p>
      </header>

      <RecommendationForm onSubmit={handleSubmit} />

      <p className="recommendation__specialist">
        Not sure which mattress to buy?{' '}
        <a
          href={site.whatsapp.specialist}
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat with a mattress specialist on WhatsApp.
        </a>
      </p>

      {submission ? (
        <RecommendationResults
          answers={submission.answers}
          matches={submission.matches}
        />
      ) : null}
    </div>
  );
}
