import {
  BrowserClient,
  defaultStackParser,
  getClient,
  isInitialized as sentryIsInitialized,
  makeFetchTransport,
  Scope,
} from '@sentry/react'

import {isDev} from '../environment'
import {SANITY_VERSION} from '../version'
import {type FeedbackPayload} from './types'

const clientsByDsn = new Map<string, Scope>()

/**
 * Get the Sentry scope for a given DSN.
 * @param dsn - Sentry DSN to get the scope for.
 * Format: `https://[key]@[host]/[project-id]`
 * @returns The Sentry scope.
 */
function getFeedbackScope(dsn: string): Scope {
  const globalClient = sentryIsInitialized() ? getClient() : undefined
  const globalDsn = globalClient?.getOptions().dsn

  if (globalClient && globalDsn === dsn) {
    const scope = new Scope()
    scope.setClient(globalClient)
    return scope
  }

  const cached = clientsByDsn.get(dsn)
  if (cached) {
    return cached
  }

  const client = new BrowserClient({
    dsn,
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
  const scope = getFeedbackScope(payload.dsn)

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
