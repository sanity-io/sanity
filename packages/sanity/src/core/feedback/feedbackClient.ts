import {BrowserClient, defaultStackParser, makeFetchTransport, Scope} from '@sentry/react'

import {isDev} from '../environment'
import {SANITY_VERSION} from '../version'
import {type FeedbackPayload} from './types'

/** @internal */
export const FEEDBACK_TUNNEL_URL = 'https://api.sanity.io/vX/intake/feedback'

const clientsByDsn = new Map<string, Scope>()

/**
 * Get or create a dedicated Sentry client and scope for sending feedback.
 * Each DSN gets its own client with the feedback tunnel.
 * @param dsn - Sentry DSN for the target project.
 * Format: `https://[key]@[host]/[project-id]`
 * @returns The Sentry scope bound to a feedback-specific client.
 */
function getFeedbackClient(dsn: string): Scope {
  const cached = clientsByDsn.get(dsn)
  if (cached) {
    return cached
  }

  const client = new BrowserClient({
    dsn,
    tunnel: FEEDBACK_TUNNEL_URL,
    release: SANITY_VERSION,
    environment: isDev ? 'development' : 'production',
    stackParser: defaultStackParser,
    integrations: [],
    transport: makeFetchTransport,
  })

  const scope = new Scope()
  scope.setClient(client)
  client.init()

  clientsByDsn.set(dsn, scope)
  return scope
}

/**
 * Send user feedback to Sentry.
 * Waits for the transport to flush so network-level failures
 * (ad blockers, timeouts) propagate to the caller.
 *
 * @internal
 */
export async function sendFeedbackToSentry(payload: FeedbackPayload): Promise<string> {
  const scope = getFeedbackClient(payload.dsn)

  const {message, name, email, source, feedbackVersion, telemetryConsent, tags, attachments} =
    payload

  const hasTelemetryConsent = telemetryConsent === 'granted'
  const hasContactConsent = String(tags.contactConsent) === 'true'
  // Keep in mind that users should be made aware that their name and email are shared with the Sanity team
  // In the UI, even if they have given us consent
  const sharePii = hasTelemetryConsent || hasContactConsent

  const {userId: _userId, ...safeTags} = tags
  const eventTags = sharePii ? tags : safeTags

  const feedbackEvent = {
    contexts: {
      feedback: {
        contactEmail: sharePii ? email : undefined,
        name: sharePii ? name : undefined,
        message,
        url: tags.url,
        source,
      },
    },
    type: 'feedback' as const,
    level: 'info' as const,
    tags: {
      ...eventTags,
      feedbackVersion,
      ...(sharePii ? {contactName: name ?? ''} : {}),
      ...(sharePii ? {contactEmail: email ?? ''} : {}),
      telemetryConsent,
      type: 'feedback',
      source,
    },
  }

  const hint = attachments?.length ? {attachments} : {}

  const eventId = scope.captureEvent(feedbackEvent, hint)

  const client = scope.getClient()
  if (client) {
    await client.flush(10_000)
  }

  return eventId
}
