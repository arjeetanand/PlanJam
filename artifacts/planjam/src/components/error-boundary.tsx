import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <main className="app-shell flex min-h-[100dvh] w-full items-center justify-center p-5 sm:p-8">
      <div className="ink-card w-full max-w-lg rounded-[2rem] p-7 text-center sm:p-9">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#F26F52]">small detour</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-.06em] text-[#27304C]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6A6E80]">
          This part of the app hit an error. The rest of the app is still
          running.
        </p>
        {/* Dev only: messages can carry API responses and other internals. */}
        {import.meta.env.DEV ? (
          <pre className="mt-4 max-w-full overflow-x-auto rounded-xl border border-[#D9D7D0] bg-[#F0EDE1] p-3 text-left text-xs text-[#5E6377]">
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#27304C] px-5 py-3 text-sm font-bold text-[#FFF7E8] shadow-[0_4px_0_#11182D] hover:bg-[#343e5e]"
          data-testid="button-error-retry"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
