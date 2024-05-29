import {
  breadcrumbsIntegration,
  browserApiErrorsIntegration,
  BrowserClient,
  type BrowserOptions,
  captureException,
  dedupeIntegration,
  defaultStackParser,
  type Event,
  type Exception,
  functionToStringIntegration,
  getClient,
  getCurrentScope,
  globalHandlersIntegration,
  httpContextIntegration,
  inboundFiltersIntegration,
  init,
  isInitialized as sentryIsInitialized,
  linkedErrorsIntegration,
  makeFetchTransport,
  Scope,
  withScope,
} from '@sentry/react'

import {isDev} from '../../environment'
import {isRecord} from '../../util'
import {globalScope} from '../../util/globalScope'
import {SANITY_VERSION} from '../../version'
import {type ErrorInfo, type ErrorReporter} from '../errorReporter'

const SANITY_DSN =
  'https://8914c8dde7e1ebce191f15af8bf6b7b9@o131006.ingest.us.sentry.io/4507342122123264'

const IS_EMBEDDED_STUDIO = !('__sanityErrorChannel' in globalScope)

const DEBUG_ERROR_REPORTING = Boolean(process.env.SANITY_STUDIO_DEBUG_ERROR_REPORTING)

const clientOptions: BrowserOptions = {
  dsn: SANITY_DSN,
  release: SANITY_VERSION,
  environment: isDev ? 'development' : 'production',
  debug: DEBUG_ERROR_REPORTING,
  enabled: !isDev || DEBUG_ERROR_REPORTING,
}

const integrations = [
  inboundFiltersIntegration(),
  functionToStringIntegration(),
  browserApiErrorsIntegration({eventTarget: false}),
  breadcrumbsIntegration({console: false}),
  globalHandlersIntegration({onerror: true, onunhandledrejection: true}),
  linkedErrorsIntegration(),
  dedupeIntegration(),
  sanityDedupeIntegration(),
  httpContextIntegration(),
]

/**
 * Get an instance of the Sentry error reporter
 *
 * @internal
 */
export function getSentryErrorReporter(): ErrorReporter {
  let client: BrowserClient | undefined
  let scope: Scope | undefined
  let prevMessage: string | undefined
  let isInitialized = false

  function initialize() {
    if (isInitialized) {
      return
    }

    if (IS_EMBEDDED_STUDIO) {
      client = new BrowserClient({
        ...clientOptions,
        transport: makeFetchTransport,
        stackParser: defaultStackParser,
        integrations,
        beforeSend,
      })

      scope = new Scope()
      scope.setClient(client)

      // Initializing has to be done after setting the client on the scope
      client.init()
    } else if (!sentryIsInitialized()) {
      init({
        ...clientOptions,
        defaultIntegrations: false,
        integrations,
        beforeSend,
      })
      client = getClient()
      scope = getCurrentScope()
    }

    // By this point, Sentry will already have registered a global error handler if not in an
    // embedded studio (only the root hub reports errors on the global scope)
    isInitialized = true
  }

  function assertInitialized() {
    if (!isInitialized) {
      console.warn('Error reporter is not initialized')
    }
  }

  function reportError(error: Error, options: ErrorInfo = {}) {
    assertInitialized()
    if (!client) {
      return null
    }

    // Skip reporting duplicate errors
    const errMessage = getMessage(error)
    if (errMessage && errMessage === prevMessage) {
      return null
    }

    const {reactErrorInfo = {}, errorBoundary} = options
    const {componentStack} = reactErrorInfo

    // Decorate the error report with relevant context and tags
    const contexts: Record<string, Record<string, unknown> | undefined> = {}
    if (componentStack) {
      contexts.react = {componentStack}
    }

    const tags: {[key: string]: number | string | boolean | null | undefined} = {
      handled: 'no',
    }

    if (errorBoundary) {
      tags.errorBoundary = errorBoundary
    }

    let eventId: string | null = null
    withScope(() => {
      if (componentStack && isError(error)) {
        const errorBoundaryError = new Error(error.message)
        errorBoundaryError.name = `${errorBoundary || 'ErrorBoundary'} ${error.name}`
        errorBoundaryError.stack = componentStack

        // Using the `LinkedErrors` integration to link the errors together.
        setCause(error, errorBoundaryError)
      }

      eventId = captureException(error, {
        mechanism: {handled: false},
        captureContext: {contexts, tags},
      })
    })

    return eventId ? {eventId} : null
  }

  return {
    initialize,
    reportError,
  }
}

const objectToString = Object.prototype.toString

/**
 * Checks whether given value's type is one of a few Error or Error-like
 *
 * @param thing - A value to be checked
 * @returns A boolean representing the result
 * @internal
 */
function isError(thing: unknown): thing is Error & {cause?: Error} {
  switch (objectToString.call(thing)) {
    case '[object Error]':
    case '[object Exception]':
    case '[object DOMException]':
      return true
    default:
      return isInstanceOf(thing, Error)
  }
}

/**
 * Checks whether given value's type is an instance of provided constructor.
 *
 * @param thing - A value to be checked.
 * @param base - A constructor to be used in a check.
 * @returns A boolean representing the result.
 * @internal
 */
function isInstanceOf(thing: unknown, base: any): boolean {
  try {
    return thing instanceof base
  } catch (_e) {
    return false
  }
}

/**
 * Set the `cause` property on an error object
 *
 * @param error - The error to set the cause on
 * @param cause - The cause of the error
 * @internal
 */
function setCause(error: Error & {cause?: Error}, cause: Error): void {
  const seenErrors = new WeakMap<Error, boolean>()

  function recurse(err: Error & {cause?: Error | unknown}, subCause: Error): void {
    // If we've already seen the error, there is a recursive loop somewhere in the error's
    // cause chain. Let's just bail out then to prevent a stack overflow.
    if (seenErrors.has(err)) {
      return
    }

    if (isError(err.cause)) {
      seenErrors.set(err, true)
      recurse(err.cause, subCause)
      return
    }
    err.cause = subCause
  }

  recurse(error, cause)
}

/**
 * Tries to extract the `message` property from an error-like object, if it exists
 *
 * @param error - The error-like object to extract the message from
 * @returns A string representing the message, or `null` if not found
 * @internal
 */
function getMessage(error: Error | null): string | null {
  return isRecord(error) && typeof error.message === 'string' ? error.message : null
}

/**
 * Sentry treats errors that are caught in an error boundary as "handled", which we don't want.
 * It gives a false sense of security, as the error is only caught to show a more helpful error
 * than a blank page. This function sets the `handled` prop on the error's mechanism to `false`.
 * Note: This _mutates_ the event, in order to avoid having to deep-clone.
 *
 * @param event - The event to mark as unhandled
 * @internal
 */
function setAsUnhandled(event: {exception?: {values?: Exception[]}}) {
  for (const exception of event.exception?.values || []) {
    if (exception.mechanism) {
      exception.mechanism.handled = false
    }
  }
}

/**
 * "Before send" event handler, which sets the error as unhandled.
 * @see setAsUnhandled for a clearer rationale.
 *
 * @param event - The event to be sent
 * @returns The event to be sent
 * @internal
 */
function beforeSend(event: {exception?: {values?: Exception[]}}) {
  setAsUnhandled(event)
  return event
}

/**
 * We'll want a more aggressive dedupe strategy than the default one, as the default is very
 * fine grained, needing the same exact stack and message to be considered a duplicate.
 * We want to be more conservative.
 *
 * @internal
 */
function sanityDedupeIntegration() {
  const previousEvents: Event[] = []

  return {
    name: 'SanityDedupe',
    setupOnce() {
      // intentionally empty - required to not crash Sentry
    },
    processEvent(currentEvent: Event): Event | null | PromiseLike<Event | null> {
      // We want to ignore any non-error type events, e.g. transactions or replays
      // These should never be deduped, and also not be compared against _previousEvent.
      if (currentEvent.type) {
        return currentEvent
      }

      // Juuust in case something goes wrong
      try {
        if (shouldDropEvent(currentEvent, previousEvents)) {
          if (DEBUG_ERROR_REPORTING) {
            console.warn(
              '[sanity/sentry] Dropping error from being reported because it is a duplicate',
            )
          }
          return null
        }
      } catch (_) {
        /* empty */
      }

      // Keep the last 10 events around for comparison
      if (previousEvents.length > 10) {
        previousEvents.shift()
      }

      previousEvents.push(currentEvent)
      return currentEvent
    },
  }
}

/**
 * Determines wether or not the given event should be dropped or not, based on a window of
 * previously reported events.
 *
 * @param currentEvent - The event to check
 * @param previousEvents - An array of previously reported events
 * @returns True if event should be dropped, false otherwise
 * @internal
 */
function shouldDropEvent(currentEvent: Event, previousEvents: Event[]): boolean {
  for (const previousEvent of previousEvents) {
    const currentMessage = getMessageFromEvent(currentEvent)
    const previousMessage = getMessageFromEvent(previousEvent)

    if (currentMessage && previousMessage && currentMessage !== previousMessage) {
      continue
    }

    // Sentry timestamps are in fractional seconds, not milliseconds
    const currentTimestamp = Math.floor(currentEvent.timestamp || 0)
    const previousTimestamp = Math.floor(previousEvent.timestamp || 0)

    // If the events are within 5 minutes of each other, we consider them duplicates.
    // 5 minutes is a bit much, but if an error occurs every 5 minutes, we better be
    // investigating it - and reporting the same error from the same user every 5 minutes
    // is not really helpful.
    if (Math.abs(currentTimestamp - previousTimestamp) < 300) {
      return true
    }
  }

  return false
}

/**
 * Extract the `message` string from a Sentry event. Sometimes this is not available on the `event`
 * itself, but buried inside of the `event.exception` property.
 *
 * @param event - The Sentry event to extract the message from
 * @returns A string representing the message, or `undefined` if not found
 * @internal
 */
function getMessageFromEvent(event: Event): string | undefined {
  if (event.message) {
    return event.message
  }

  if (event.exception) {
    for (const exception of event.exception.values || []) {
      if (exception.value) {
        return exception.value
      }
    }
  }

  return undefined
}
