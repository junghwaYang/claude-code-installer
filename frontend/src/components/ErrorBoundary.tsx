import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen px-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">Something went wrong</h2>
          <p className="text-sm text-white/40 mb-6 max-w-md">
            An unexpected error occurred. Please try again or restart the application.
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-primary"
          >
            Try Again
          </button>
          {this.state.error && (
            <details className="mt-6 text-white/30 text-xs max-w-md">
              <summary className="cursor-pointer hover:text-white/50">Error details</summary>
              <pre className="mt-2 text-left whitespace-pre-wrap break-words p-4 rounded-lg bg-black/20 border border-white/5">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
