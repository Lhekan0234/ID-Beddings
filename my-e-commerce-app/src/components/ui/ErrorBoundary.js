import { Component } from 'react';

/**
 * Catches JavaScript errors anywhere in the component tree during rendering
 * and shows a friendly fallback instead of a blank screen
 * (prd/agent.md section 6: loading, error and empty states).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console; a real logging service can be wired in later.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container page" role="alert">
          <h1>Something went wrong</h1>
          <p className="text-muted">
            An unexpected error occurred while displaying this page. You can try again.
          </p>
          <button type="button" className="btn btn--primary btn--md" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
