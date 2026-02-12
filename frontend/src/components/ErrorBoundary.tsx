import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const getLocale = (): 'ko' | 'en' => {
  try {
    return navigator.language.startsWith('ko') ? 'ko' : 'en';
  } catch {
    return 'en';
  }
};

const translations = {
  title: {
    ko: '오류가 발생했습니다',
    en: 'Something went wrong',
  },
  message: {
    ko: '예기치 않은 오류가 발생했습니다. 다시 시도하거나 앱을 재시작해 주세요.',
    en: 'An unexpected error occurred. Please try again or restart the application.',
  },
  retry: {
    ko: '다시 시도',
    en: 'Try Again',
  },
  details: {
    ko: '오류 상세 정보',
    en: 'Error details',
  },
};

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
      const locale = getLocale();
      return (
        <div className="flex flex-col items-center justify-center h-screen px-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">
            {translations.title[locale]}
          </h2>
          <p className="text-sm text-white/40 mb-6 max-w-md">
            {translations.message[locale]}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-primary"
          >
            {translations.retry[locale]}
          </button>
          {this.state.error && (
            <details className="mt-6 text-white/30 text-xs max-w-md">
              <summary className="cursor-pointer hover:text-white/50">
                {translations.details[locale]}
              </summary>
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
