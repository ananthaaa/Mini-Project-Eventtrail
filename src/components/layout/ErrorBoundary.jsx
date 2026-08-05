import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_#000]">
            <div className="w-16 h-16 bg-red-100 border-3 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000] mb-6 rotate-[-5deg]">
              <AlertTriangle size={32} strokeWidth={2.5} className="text-red-600" />
            </div>
            
            <h1 className="font-display font-black text-3xl uppercase tracking-tight text-black mb-4">
              Oops! Something broke.
            </h1>
            
            <p className="font-bold text-black/70 mb-6 uppercase tracking-wider text-sm">
              We encountered an unexpected error while loading this page. Our team has been notified.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} strokeWidth={3} />
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} strokeWidth={3} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
