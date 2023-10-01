import {useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {ConfigResolutionError, SchemaError} from '../config'
import {CorsOriginError, TimelineError} from '../store'
import {globalScope} from '../util'

const errorChannel = globalScope.__sanityErrorChannel

/**
 * Attaches a listener to the global error channel and displays a toast when a (unknown)
 * error occurs. Compares the last displayed error message with the current
 *
 * @internal
 */
export function ErrorLogger(): null {
  const {push: pushToast} = useToast()

  useEffect(() => {
    if (!errorChannel) return undefined

    // errorChannel.subscribe() returns a unsubscriber function.
    // By returning it from this `useEffect`, it'll unsubscribe on unmount.
    return errorChannel.subscribe((msg) => {
      // NOTE: Certain errors (such as the `ResizeObserver loop limit exceeded` error) is thrown
      // by the browser, and does not include an `error` property. We ignore these errors.
      if (!msg.error) {
        return
      }

      // For errors that we "expect", eg have specific error screens for, do not push a toast
      if (isKnownError(msg.error)) {
        return
      }

      console.error(msg.error)

      pushToast({
        // Use the error message as the ID in order to prevent duplicates from showing
        // A bit of a hack, but serves
        id: msg.error.message,
        closable: true,
        description: msg.error.message,
        duration: 5000,
        title: 'Uncaught error',
        status: 'error',
      })
    })
  }, [pushToast])

  return null
}

function isKnownError(err: Error): boolean {
  if (err instanceof SchemaError) {
    return true
  }

  if (err instanceof CorsOriginError) {
    return true
  }

  if (err instanceof ConfigResolutionError) {
    return true
  }

  if (err instanceof TimelineError) {
    return true
  }

  return false
}
