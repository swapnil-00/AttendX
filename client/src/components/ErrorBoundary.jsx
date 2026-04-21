import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// Fix #15 — ErrorBoundary now uses CSS classes with dark-mode support (see index.css)
// Cannot use hooks in class components, so we rely on the .dark class on <html>
// which is set by ThemeContext.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertTriangle size={32} color="#dc2626" strokeWidth={2} />
            </div>
            <h1 className="error-boundary-title">
              Something went wrong
            </h1>
            <p className="error-boundary-body">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              className="error-boundary-btn"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }} className="error-boundary-summary">
                  Error Details
                </summary>
                <pre className="error-boundary-pre">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
