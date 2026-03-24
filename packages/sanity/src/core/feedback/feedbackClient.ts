import {BrowserClient, defaultStackParser, makeFetchTransport, Scope} from '@sentry/react'

import {isDev} from '../environment'
import {SANITY_VERSION} from '../version'
import {type FeedbackPayload} from './types'

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
    tunnel: 'https://www.sanity.io/ingest/feedback',
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
 * Send user feedback to Sentry
 *
 * @internal
 */
export function sendFeedbackToSentry(payload: FeedbackPayload): string {
  const scope = getFeedbackClient(payload.dsn)

  const {
    message,
    name,
    email,
    source,
    sentiment,
    contactConsent,
    feedbackVersion,
    tags,
    attachments,
  } = payload

  const feedbackEvent = {
    contexts: {
      feedback: {
        contactEmail: email,
        name,
        message,
        url: tags.url,
        source,
      },
    },
    type: 'feedback' as const,
    level: 'info' as const,
    tags: {
      ...tags,
      feedbackVersion,
      sentiment,
      contactConsent: String(contactConsent),
      contactEmail: email ?? '',
      contactName: name ?? '',
      type: 'feedback',
      source,
    },
  }

  const hint = attachments?.length ? {attachments} : {}

  return scope.captureEvent(feedbackEvent, hint)
}
