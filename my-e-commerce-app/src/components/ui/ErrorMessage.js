import './ErrorMessage.css';

/** Inline error message with an alert role for assistive tech. */
export default function ErrorMessage({ title = 'Something went wrong', message }) {
  return (
    <div className="error-message" role="alert">
      <strong className="error-message__title">{title}</strong>
      {message ? <span className="error-message__message">{message}</span> : null}
    </div>
  );
}
