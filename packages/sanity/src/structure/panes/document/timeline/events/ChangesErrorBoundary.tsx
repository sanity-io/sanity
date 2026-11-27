import {type ReactNode, useCallback, useState} from 'react'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary/ErrorBoundary'

/**
 * Shows `fallback` when rebuilding or rendering what an edit changed crashes, so the crash stays in
 * the part showing it (a card's field titles, the changes popover) instead of taking down the
 * inspector. Give it a `key` that changes with what it shows, to try again.
 */
export function ChangesErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const [error, setError] = useState<Error | null>(null)
  const handleCatch = useCallback(({error: caughtError}: {error: Error}) => {
    setError(caughtError)
  }, [])

  if (error) return fallback
  return <ErrorBoundary onCatch={handleCatch}>{children}</ErrorBoundary>
}
