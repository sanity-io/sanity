import {type ErrorBoundaryProps} from '@sanity/ui'
import {lazy, type ReactNode, useCallback, useState} from 'react'
import {useHotModuleReload} from 'use-hot-module-reload'

import {ErrorBoundary} from '../../ui-components/errorBoundary/ErrorBoundary'
import {SchemaError} from '../config'
import {errorReporter} from '../error/errorReporter'
import {isImportError} from '../error/isImportError'
import {CorsOriginError} from '../store'
import {CorsOriginErrorScreen, SchemaErrorsScreen} from './screens'
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
  getErrorScreen?: (error: Error) => ReactNode | null
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
  const {children, heading = 'An error occurred', getErrorScreen} = props
  const [caughtError, setCaughtError] = useState<ErrorBoundaryState>()
  const [errorScreen, setErrorScreen] = useState<ReactNode>()
  const handleResetError = useCallback(() => setCaughtError(undefined), [])

  const handleCatchError: ErrorBoundaryProps['onCatch'] = useCallback(
    (params) => {
      let eventId: string | undefined
      // The run() wrapper instead of doing it inline in try/catch is because of the React Compiler not fully supporting the syntax yet
      const run = () => {
        eventId = errorReporter.reportError(params.error, {
          reactErrorInfo: params.info,
          errorBoundary: 'StudioErrorBoundary',
        })?.eventId
      }
      try {
        run()
      } catch (e) {
        e.message = `Encountered an additional error when reporting error: ${e.message}`
        console.error(e)
      }
      setErrorScreen(getErrorScreen?.(params.error))
      setCaughtError({
        error: params.error,
        componentStack: params.info.componentStack,
        eventId,
      })
    },
    [getErrorScreen],
  )

  useHotModuleReload(handleResetError)

  if (!caughtError?.error) {
    return <ErrorBoundary onCatch={handleCatchError}>{children}</ErrorBoundary>
  }

  if (errorScreen) {
    return errorScreen
  }

  if (caughtError.error instanceof CorsOriginError) {
    return (
      <CorsOriginErrorScreen
        projectId={caughtError.error.projectId}
        isStaging={caughtError.error.isStaging}
      />
    )
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
