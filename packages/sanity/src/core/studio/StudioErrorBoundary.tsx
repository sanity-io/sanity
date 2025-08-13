import {type ErrorBoundaryProps} from '@sanity/ui'
import {lazy, type ReactNode, useCallback, useState} from 'react'
import {useHotModuleReload} from 'use-hot-module-reload'

import {ErrorBoundary} from '../../ui-components/errorBoundary/ErrorBoundary'
import {SchemaError} from '../config/SchemaError'
import {errorReporter} from '../error/errorReporter'
import {isImportError} from '../error/isImportError'
import {CorsOriginError} from '../store/_legacy/cors/CorsOriginError'
import {CorsOriginErrorScreen} from './screens/CorsOriginErrorScreen'
import {SchemaErrorsScreen} from './screens/schemaErrors/SchemaErrorsScreen'
import {FallbackErrorScreen} from './screens/FallbackErrorScreen'
import {ImportErrorScreen} from './screens/ImportErrorScreen'

/**
 * The DevServerStoppedErrorScreen will always have been lazy loaded to client
 * in instances where it is used, since DevServerStoppedError is only thrown
 * when this module is loaded, and this screen is also conditional on this error type
 */
const DevServerStoppedErrorScreen = lazy(() =>
  import('./ViteDevServerStopped').then((DevServerStopped) => ({
    default: DevServerStopped.DevServerStoppedErrorScreen,
  })),
)

interface StudioErrorBoundaryProps {
  children: ReactNode
  heading?: string
}

type ErrorBoundaryState = {
  componentStack?: string | null
  error?: Error
  eventId?: string
}

/**
 * This is responsible for handling all errors that may happen in a React Subtree of a Studio application.
 * Note: there might be several instances of this component mounted in the React tree, avoid writing code that
 * assumes there's only one at any given time.
 * This will only catch errors that happens in the React effect/render layer, and will not catch errors that happens outside React-land, including the following:
 * - Errors happening in a React event handler (i.e. onClick)
 * - Async errors/promise rejections (i.e. fetch(), setTimeout()) even if initially triggered by React
 * @param props - {@link StudioErrorBoundaryProps}
 */
export function StudioErrorBoundary(props: StudioErrorBoundaryProps) {
  const {children, heading = 'An error occurred'} = props
  const [caughtError, setCaughtError] = useState<ErrorBoundaryState>()
  const handleResetError = useCallback(() => setCaughtError(undefined), [])
  const handleCatchError: ErrorBoundaryProps['onCatch'] = useCallback((params) => {
    let eventId: string | undefined
    try {
      eventId = errorReporter.reportError(params.error, {
        reactErrorInfo: params.info,
        errorBoundary: 'StudioErrorBoundary',
      })?.eventId
    } catch (e) {
      e.message = `Encountered an additional error when reporting error: ${e.message}`
      console.error(e)
    }
    setCaughtError({
      error: params.error,
      componentStack: params.info.componentStack,
      eventId,
    })
  }, [])

  useHotModuleReload(handleResetError)

  if (!caughtError?.error) {
    return <ErrorBoundary onCatch={handleCatchError}>{children}</ErrorBoundary>
  }

  if (caughtError.error instanceof CorsOriginError) {
    return <CorsOriginErrorScreen projectId={caughtError.error.projectId} />
  }

  if (caughtError.error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={caughtError.error.schema} />
  }

  if (
    'ViteDevServerStoppedError' in caughtError.error &&
    caughtError.error.ViteDevServerStoppedError
  ) {
    return <DevServerStoppedErrorScreen />
  }

  if (isImportError(caughtError.error)) {
    // We auto-reload here under the assumption that an import error is caused by React.lazy import failing
    // is likely caused by a new deployment.
    return <ImportErrorScreen error={caughtError.error} eventId={caughtError.eventId} autoReload />
  }

  return (
    <FallbackErrorScreen
      heading={heading}
      error={caughtError.error}
      eventId={caughtError.eventId}
      onReset={handleResetError}
    />
  )
}
