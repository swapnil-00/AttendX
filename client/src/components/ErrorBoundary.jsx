import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

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
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '480px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={32} color="#dc2626" strokeWidth={2} />
            </div>
            <h1 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111827', margin: '0 0 12px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
              onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
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
