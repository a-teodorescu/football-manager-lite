import React from "react";

interface ErrorBoundaryState {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ error, errorInfo });
  }

  private copyDebugInfo = async (): Promise<void> => {
    const payload = {
      app: "football-manager-lite",
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  };

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <main className="page recovery-page">
        <section className="panel highlight-panel recovery-panel">
          <span className="team-label">Recovery mode</span>
          <h1>Jocul a prins o eroare in UI.</h1>
          <p className="muted">
            Datele salvate nu sunt sterse automat. Incearca sa revii in Dashboard sau copiaza pachetul de debug pentru investigatie.
          </p>
          <pre className="debug-pre">{this.state.error.message}</pre>
          <div className="button-row">
            <button type="button" onClick={() => window.location.reload()}>
              Reincarca aplicatia
            </button>
            <button type="button" className="secondary-button" onClick={this.copyDebugInfo}>
              Copiaza debug error
            </button>
          </div>
        </section>
      </main>
    );
  }
}
