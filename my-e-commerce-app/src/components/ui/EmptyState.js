import './EmptyState.css';

/** Friendly message shown when a list/search has no results. */
export default function EmptyState({ title = 'Nothing to show yet', message, action }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">
        🛏️
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message ? <p className="empty-state__message">{message}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
