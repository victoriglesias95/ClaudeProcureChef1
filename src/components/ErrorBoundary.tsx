import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Store error details in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      };
      localStorage.setItem('last_error', JSON.stringify(errorLog));
      
      // Also keep a history of errors
      const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
      errorHistory.push(errorLog);
      if (errorHistory.length > 10) errorHistory.shift(); // Keep only last 10 errors
      localStorage.setItem('error_history', JSON.stringify(errorHistory));
    } catch (e) {
      // Ignore storage errors
    }
    
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-300 rounded-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">An error occurred in the application.</p>
          <div className="mb-4">
            <pre className="bg-white p-4 rounded overflow-auto max-h-48 text-sm">
              {this.state.error?.toString()}
            </pre>
          </div>
          {this.state.errorInfo && (
            <div className="mb-4">
              <h3 className="font-bold text-red-700 mb-2">Component Stack</h3>
              <pre className="bg-white p-4 rounded overflow-auto max-h-48 text-xs">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
            <button 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={() => {
                console.log('Error Details:', {
                  error: this.state.error,
                  errorInfo: this.state.errorInfo,
                  history: JSON.parse(localStorage.getItem('error_history') || '[]')
                });
                alert('Error details logged to console');
              }}
            >
              Log Details
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;