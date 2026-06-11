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
 * Timing/outcome record for a completed (or failed) HTTP request, used
 * for diagnostic breadcrumbs on subsequent error reports.
 *
 * @internal
 */
export interface RequestRecord {
  url: string
  method: string
  statusCode?: number
  durationMs: number
  failed?: boolean
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
   * Records a request timing/outcome as a diagnostic breadcrumb attached
   * to subsequent error events. No-op when the reporter isn't active.
   * Callers are responsible for consent gating.
   */
  recordRequest?: (record: RequestRecord) => void
}

/**
 * Singleton instance of an error reporter, that will send errors encountered during execution or
 * rendering to Sanity (potentially to a third party error tracking service).
 *
 * @internal
 */
export const errorReporter = getSentryErrorReporter()
