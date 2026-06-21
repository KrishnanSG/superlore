import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Render-time error boundary. The Viewer keeps the last *good* render across compile errors;
 * this guards the complementary case — a component that throws while rendering (e.g. a malformed
 * Canvas spec mid-edit) — so a transient bad render shows a message instead of a blank webview.
 * Resets itself when its children change (the next valid `update` re-renders cleanly).
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in the webview devtools console for debugging.
    console.error("superlore Preview render error:", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="kp-ext-doc-wrap">
          <div role="alert" className="kp-ext-error">
            <p className="kp-ext-error-title">Render error</p>
            <pre className="kp-ext-error-body">{this.state.error.message}</pre>
            <button
              type="button"
              className="kp-ext-retry"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
