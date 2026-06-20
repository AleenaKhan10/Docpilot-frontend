import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import Button from "./ui/Button";

interface Props {
  /** Changing this prop resets the boundary — pass location.pathname so
   *  a navigation away from the broken route gives the next page a fresh start. */
  resetKey?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Localized error boundary for the protected content area. Catches render
 * errors thrown by lazy-loaded route components and shows a recoverable
 * message instead of blanking the entire app shell. The sidebar / topbar
 * stay mounted because this sits *inside* the layout, not above it.
 *
 * Reset happens automatically when `resetKey` changes (we pass
 * location.pathname) and via the explicit "Try again" button.
 */
class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a breadcrumb in the console so the dev can pull the stack
    // immediately. A real telemetry hookup goes here later.
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 max-w-[480px] mx-auto text-center">
        <div className="w-10 h-10 rounded-full bg-err-bg border border-err-line flex items-center justify-center mb-4">
          <AlertTriangle size={16} className="text-err-fg" />
        </div>
        <div className="text-[15px] font-semibold text-t1 mb-1.5">
          Something went wrong on this page
        </div>
        <p className="text-[12px] text-t4 mb-4 leading-relaxed">
          The page failed to render. The rest of the app is still working —
          you can try this page again, or use the sidebar to go elsewhere.
        </p>
        <code className="block w-full text-left px-3 py-2 mb-5 rounded-sm bg-s2 border border-l1 font-mono text-[10px] text-t3 overflow-auto max-h-32">
          {error.message || String(error)}
        </code>
        <Button variant="primary" onClick={this.handleReset} icon={<RotateCw size={12} />}>
          Try again
        </Button>
      </div>
    );
  }
}

export default RouteErrorBoundary;
