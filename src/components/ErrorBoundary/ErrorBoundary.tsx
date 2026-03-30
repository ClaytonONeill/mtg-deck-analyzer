// Modules
import { Component } from "react";

// Types
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ?? null,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Safe to wire up to an external logger here later e.g. Sentry
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            {/* Icon */}
            <div className="text-5xl">🃏</div>

            {/* Heading */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-white">
                Something went wrong
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                The page ran into an unexpected error and could not recover.
                Your decks are safe — this is a display issue only.
              </p>
            </div>

            {/* Error detail — collapsed by default */}
            {this.state.errorMessage && (
              <details className="w-full text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  Error details
                </summary>
                <p className="mt-2 text-xs text-red-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono break-all">
                  {this.state.errorMessage}
                </p>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href="/"
                onClick={this.handleReset}
                className="bg-[#1971c2] hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Take me home
              </a>
              <button
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
                className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-5 py-2.5 rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
