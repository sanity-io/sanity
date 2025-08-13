import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {useHotModuleReload} from 'use-hot-module-reload'

import {SchemaError} from '../config/SchemaError'
import {errorReporter} from '../error/errorReporter'
import {isImportError} from '../error/isImportError'
import {isKnownError} from '../error/isKnownError'
import {CorsOriginError} from '../store/_legacy/cors/CorsOriginError'
import {globalScope} from '../util/globalScope'
import {CorsOriginErrorScreen} from './screens/CorsOriginErrorScreen'
import {SchemaErrorsScreen} from './screens/schemaErrors/SchemaErrorsScreen'
import {FallbackErrorScreen} from './screens/FallbackErrorScreen'
import {ImportErrorScreen} from './screens/ImportErrorScreen'

type ErrorState = {
  error?: Error | null
  eventId?: string
}

const errorChannel = globalScope.__sanityErrorChannel

/**
 * This is responsible for handling uncaught errors that may happen in a Studio application outside of React error boundaries.
 * In standalone Studios, this component will also handle window.onerror events and unhandledrejection-events by subscribing
 * to the global error channel.
 * Note: errors that occur before this component is mounted will be handled by the GlobalErrorHandler.tsx in CLI/Dev server
 * Note2: This should not be used as a general React error boundary, and there should never be more than one instance of this
 * per Studio application.
 * To wrap React subtrees, use the {@link StudioErrorBoundary} component instead.
 */
export function StudioRootErrorHandler(props: {children: ReactNode}) {
  const {children} = props
  const [errorState, setErrorState] = useState<ErrorState>()

  const handleResetError = useCallback(() => setErrorState(undefined), [])
  const toast = useToast()

  useHotModuleReload(handleResetError)
  useEffect(() => {
    if (!errorChannel) return undefined

    // Note: subscribing to the error channel will "claim" global error handling, see GlobalErrorHandler.tsx
    // errorChannel.subscribe() returns a unsubscriber function.
    // By returning it from this `useEffect`, it'll unsubscribe on unmount.
    return errorChannel.subscribe((event) => {
      // NOTE: Certain errors (such as the `ResizeObserver loop limit exceeded` error) is thrown
      // by the browser, and does not include an `error` property. We ignore these errors.
      if (!event.error) {
        return
      }

      if (!(event.error instanceof Error)) {
        return
      }

      // For errors that we "expect", eg have specific errorState screens for, do not report or push a toast
      // Note: these might already be handled by the error boundary
      if (isKnownError(event.error)) {
        setErrorState({error: event.error})
        return
      }

      let eventId: string | undefined
      try {
        eventId = errorReporter.reportError(event.error)?.eventId
      } catch (e) {
        e.message = `Encountered an additional error when reporting error: ${e.message}`
        console.error(e)
      }

      if (isImportError(event.error)) {
        // If it's an import error, we want to show it specially
        setErrorState({error: event.error, eventId})
        return
      }

      toast.push({
        // Use the error message as the ID in order to prevent duplicates from showing
        // A bit of a hack, but serves
        id: event.error.message,
        closable: true,
        description: event.error.message,
        duration: 5000,
        title: 'Uncaught error',
        status: 'error',
      })
    })
  }, [toast])

  if (!errorState?.error) {
    return children
  }

  if (errorState.error instanceof CorsOriginError) {
    return <CorsOriginErrorScreen projectId={errorState.error.projectId} />
  }

  if (errorState.error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={errorState.error.schema} />
  }

  if (isImportError(errorState.error)) {
    return <ImportErrorScreen error={errorState.error} eventId={errorState.eventId} />
  }

  return (
    <FallbackErrorScreen
      error={errorState.error}
      eventId={errorState.eventId}
      onReset={handleResetError}
    />
  )
}
