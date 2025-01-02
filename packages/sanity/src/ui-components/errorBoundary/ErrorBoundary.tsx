import {
  // eslint-disable-next-line no-restricted-imports
  ErrorBoundary as UIErrorBoundary,
  type ErrorBoundaryProps as UIErrorBoundaryProps,
} from '@sanity/ui'
import {useCallback, useContext} from 'react'

import {SourceContext} from '../../_singletons'

export type ErrorBoundaryProps = UIErrorBoundaryProps

/**
 * ErrorBoundary component that catches errors and uses onUncaughtError config property
 * It also calls the onCatch prop if it exists.
 */
export function ErrorBoundary({onCatch, ...rest}: ErrorBoundaryProps): React.JSX.Element {
  // Use context, because source could be undefined and we don't want to throw in that case
  const source = useContext(SourceContext)

  const handleCatch = useCallback(
    ({error: caughtError, info: caughtInfo}: {error: Error; info: React.ErrorInfo}) => {
      // Send the error to the source if it has an onUncaughtError method
      source?.onUncaughtError?.(caughtError, caughtInfo)

      // Call the onCatch prop if it exists
      onCatch?.({error: caughtError, info: caughtInfo})
    },
    [source, onCatch],
  )

  return <UIErrorBoundary {...rest} onCatch={handleCatch} />
}
