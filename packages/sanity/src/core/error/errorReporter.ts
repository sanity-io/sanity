import {type ErrorInfo as ReactErrorInfo} from 'react'

import {getSentryErrorReporter} from './sentry/sentryErrorReporter'

/**
 * @internal
 */
export interface ErrorInfo {
  reactErrorInfo?: ReactErrorInfo
  errorBoundary?: string
}

/**
 * @internal
 */
export interface ErrorReporter {
  /** Call to prepare the error reporter for use */
  initialize: () => void

  /**
   * Reports an error, as caught by an error handler or a React boundary.
   *
   * @param error - The error that is caught. Note that while typed as `Error` by Reacts `componentDidCatch`, it can also be invoked with non-error objects.
   * @param options - Additional options for the error report
   * @returns An object containing information on the reported error, or `null` if ignored
   */
  reportError: (error: Error, options?: ErrorInfo) => {eventId: string} | null
  /**
   * In some cases (for example, when we are respecting telemetry consent and not sending data to 3rd parties),
   * we may start the error reporter in a pending state, where it will not report errors.
   * This method can be used to activate the error reporter.
   */
  enable: () => void
  disable: () => void
}

/**
 * Singleton instance of an error reporter, that will send errors encountered during execution or
 * rendering to Sanity (potentially to a third party error tracking service).
 *
 * @internal
 */
export const errorReporter = getSentryErrorReporter()
