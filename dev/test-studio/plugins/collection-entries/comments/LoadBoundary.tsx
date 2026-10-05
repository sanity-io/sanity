import {Component, type ErrorInfo, type ReactNode, Suspense} from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {error: null}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error}
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Failed to load comments', error, info.componentStack)
  }

  override render() {
    return this.state.error === null ? this.props.children : this.props.fallback
  }
}

interface LoadBoundaryProps {
  loading: ReactNode
  failed?: ReactNode
  children: ReactNode
}

// SDK reads suspend and can throw, so one slow or failing read never blanks the column or the form.
export function LoadBoundary({loading, failed = loading, children}: LoadBoundaryProps) {
  return (
    <ErrorBoundary fallback={failed}>
      <Suspense fallback={loading}>{children}</Suspense>
    </ErrorBoundary>
  )
}
