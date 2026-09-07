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
        <div className="min-h-screen bg-base-100 flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-sm leading-relaxed">
                The page ran into an unexpected error and could not recover.
                Your decks are safe — this is a display issue only.
              </p>
            </div>

            {this.state.errorMessage && (
              <details className="w-full text-left">
                <summary className="text-xs cursor-pointer hover:text-base-content transition-colors">
                  Error details
                </summary>
                <p className="mt-2 text-xs text-error bg-base-100 border border-base-800 rounded-lg px-3 py-2 font-mono break-all">
                  {this.state.errorMessage}
                </p>
              </details>
            )}

            <div className="flex gap-3">
              <a
                href="/"
                onClick={this.handleReset}
                className="btn btn-md btn-primary font-semibold"
              >
                Take me home
              </a>
              <button
                onClick={() => {
                  this.handleReset();
                  window.location.reload();
                }}
                className="btn btn-md btn-secondary font-semibold"
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
