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
  // Share name/email when the user has given consent (telemetry or contact),
  // or when the caller explicitly provided them (explicit values signal intent to share).
  const shareName = hasTelemetryConsent || hasContactConsent || !!name
  const shareEmail = hasTelemetryConsent || hasContactConsent || !!email

  const {userId: _userId, ...safeTags} = tags
  const eventTags = hasTelemetryConsent ? tags : safeTags
  const hasAttachments = attachments?.length

  const feedbackEvent = {
    contexts: {
      feedback: {
        contactEmail: shareEmail ? email : undefined,
        name: shareName ? name : undefined,
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
      ...(shareName ? {contactName: name ?? ''} : {}),
      ...(shareEmail ? {contactEmail: email ?? ''} : {}),
      telemetryConsent,
      hasAttachments,
      type: 'feedback',
      source,
    },
  }

  const hint = hasAttachments ? {attachments} : {}

  const eventId = scope.captureEvent(feedbackEvent, hint)

  const client = scope.getClient()
  if (client) {
    await client.flush(10_000)
  }

  return eventId
}
