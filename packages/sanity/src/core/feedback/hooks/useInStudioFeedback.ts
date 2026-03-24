import {useCallback} from 'react'

import {useTelemetryConsent} from '../../studio/telemetry/useTelemetryConsent'
import {sendFeedbackToSentry} from '../feedbackClient'
import {type Sentiment, type TagValue} from '../types'
import {useFeedbackTags} from './useFeedbackTags'

/** Options accepted by the `sendFeedback` function returned from {@link useInStudioFeedback}. */
export interface SendFeedbackOptions {
  /** Sentry DSN to send feedback to.
   * Format: `https://[key]@[host]/[project-id]`
   */
  dsn: string
  /** Tracks the tag schema for this feedback source. Bump when tags change. */
  feedbackVersion: string
  source: string
  message: string
  sentiment: Sentiment
  contactConsent: boolean
  extraTags?: Record<string, TagValue>
  attachments?: {filename: string; data: Uint8Array}[]
}

/** @internal */
export interface UseInStudioFeedbackReturn {
  /** Send feedback. Base and dynamic tags are included automatically. */
  sendFeedback: (opts: SendFeedbackOptions) => string
  telemetryConsent: 'loading' | 'granted' | 'denied'
}

/**
 * Hook that encapsulates tag collection and feedback submission.
 *
 * Consumers only need to provide the fields they control (message, sentiment,
 * dsn, source, etc.).
 *
 * Base tags (userAgent, studioVersion, plugins, …) and
 * dynamic tags (activeTool, url, …) are gathered automatically.
 *
 * @internal
 */
export function useInStudioFeedback(): UseInStudioFeedbackReturn {
  const {allTags, userName, userEmail} = useFeedbackTags()
  const telemetryConsent = useTelemetryConsent()

  const sendFeedback = useCallback(
    (opts: SendFeedbackOptions): string => {
      const {
        dsn,
        feedbackVersion,
        source,
        message,
        sentiment,
        contactConsent,
        extraTags,
        attachments,
      } = opts

      return sendFeedbackToSentry({
        dsn,
        feedbackVersion,
        name: userName,
        email: userEmail,
        message,
        sentiment,
        contactConsent,
        source,
        tags: {...allTags, ...extraTags},
        attachments,
      })
    },
    [allTags, userName, userEmail],
  )

  return {sendFeedback, telemetryConsent}
}
