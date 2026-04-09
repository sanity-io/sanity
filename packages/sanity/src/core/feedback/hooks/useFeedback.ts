import {useCallback, useContext} from 'react'
import {FeedbackContext} from 'sanity/_singletons'

import {sendFeedbackToSentry} from '../feedbackClient'
import {type SendFeedbackOptions} from './useInStudioFeedback'

/** Extends {@link SendFeedbackOptions} with optional user identity for out-of-studio use. */
export interface FeedbackOptions extends SendFeedbackOptions {
  /** User's name. Overrides the value from FeedbackContext when provided. */
  userName?: string
  /** User's email. Overrides the value from FeedbackContext when provided. */
  userEmail?: string
}

/** @internal */
export interface UseFeedbackReturn {
  /** Send feedback. Context-provided tags are included automatically. */
  sendFeedback: (opts: FeedbackOptions) => Promise<string>
}

/**
 * Context-based hook for feedback submission that works in any environment.
 *
 * When rendered inside a {@link StudioFeedbackProvider} (or any custom provider),
 * feedback is enriched with consent status, user info, and tags from that provider.
 *
 * When no provider is present, falls back to safe defaults:
 * anonymous feedback with consent treated as denied.
 *
 * @internal
 */
export function useFeedback(): UseFeedbackReturn {
  const {telemetryConsent, userName, userEmail, tags} = useContext(FeedbackContext)

  const sendFeedback = useCallback(
    (opts: FeedbackOptions): Promise<string> => {
      const {
        dsn,
        feedbackVersion,
        source,
        message,
        userName: userNameOverride,
        userEmail: userEmailOverride,
        extraTags,
        attachments,
      } = opts

      return sendFeedbackToSentry({
        dsn,
        feedbackVersion,
        telemetryConsent,
        name: userNameOverride ?? userName,
        email: userEmailOverride ?? userEmail,
        message,
        source,
        tags: {...tags, ...extraTags},
        attachments,
      })
    },
    [tags, userName, userEmail, telemetryConsent],
  )

  return {sendFeedback}
}
