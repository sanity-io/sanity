import {useCallback} from 'react'

import {type ConsentStatus} from '../../studio/telemetry/telemetryConsent'
import {useTelemetryConsent} from '../../studio/telemetry/useTelemetryConsent'
import {sendFeedbackToSentry} from '../feedbackClient'
import {type TagValue} from '../types'
import {useStudioFeedbackTags} from './useStudioFeedbackTags'

/** Options accepted by the `sendFeedback` function returned from {@link useInStudioFeedback}. */
export interface SendFeedbackOptions {
  /** Sentry DSN to send feedback to.
   * Format: `https://[key]@[host]/[project-id]`
   */
  dsn: string
  /** Tracks the tag schema for this feedback source. Bump when tags change. */
  feedbackVersion: string
  /** Identifies where this feedback was triggered from (e.g. 'studio-help-menu'). */
  source: string
  /**
   * The message the user is sending feedback.
   * It's mandatory as without it, Sentry will ignore the feedback upon receiving it.
   * (Mandatory Sentry field)
   */
  message: string
  /** The tags to send with the feedback. */
  extraTags?: Record<string, TagValue>
  /** The attachments to send with the feedback. */
  attachments?: {filename: string; data: Uint8Array}[]
}

/** @internal */
export interface UseInStudioFeedbackReturn {
  /** Send feedback. Base and dynamic tags are included automatically. */
  sendFeedback: (opts: SendFeedbackOptions) => Promise<string>
  telemetryConsent: ConsentStatus
}

/**
 * Hook that encapsulates tag collection and feedback submission.
 *
 * Consumers only need to provide the fields they control (message, dsn, source, etc.).
 *
 * Base tags (userAgent, studioVersion, plugins, …) and
 * dynamic tags (activeTool, url, …) are gathered automatically.
 *
 * @internal
 */
export function useInStudioFeedback(): UseInStudioFeedbackReturn {
  const {allTags, userName, userEmail} = useStudioFeedbackTags()
  const telemetryConsent = useTelemetryConsent()

  const sendFeedback = useCallback(
    (opts: SendFeedbackOptions): Promise<string> => {
      const {dsn, feedbackVersion, source, message, extraTags, attachments} = opts

      return sendFeedbackToSentry({
        dsn,
        feedbackVersion,
        telemetryConsent,
        name: userName,
        email: userEmail,
        message,
        source,
        tags: {...allTags, ...extraTags},
        attachments,
      })
    },
    [allTags, userName, userEmail, telemetryConsent],
  )

  return {sendFeedback, telemetryConsent}
}
