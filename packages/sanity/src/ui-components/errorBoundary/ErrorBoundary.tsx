import {
  ErrorBoundary as UIErrorBoundary,
  type ErrorBoundaryProps as UIErrorBoundaryProps,
} from '@sanity/ui'
import {useCallback} from 'react'

import {useSource} from '../../core/studio/source'

export type ErrorBoundaryProps = UIErrorBoundaryProps

/**
 * ErrorBoundary component that catches errors and uses onStudioError config property
 * It also calls the onCatch prop if it exists.
 */
export function ErrorBoundary({onCatch, ...rest}: ErrorBoundaryProps): JSX.Element {
  // Use context, because source could be undefined and we don't want to throw in that case
  const source = useSource()

  const handleCatch = useCallback(
    ({error: caughtError, info: caughtInfo}: {error: Error; info: React.ErrorInfo}) => {
      // Send the error to the source if it has an onStudioError method
      source?.onStudioError?.(caughtError, caughtInfo)

      // Call the onCatch prop if it exists
      onCatch?.({error: caughtError, info: caughtInfo})
    },
    [source, onCatch],
  )

  return <UIErrorBoundary {...rest} onCatch={handleCatch} />
}
