import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="container page not-found">
      <h1>Page not found</h1>
      <p className="text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn--primary btn--md">Go to homepage</Link>
    </div>
  );
}
