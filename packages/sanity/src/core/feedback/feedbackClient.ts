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
export function sendFeedback(payload: FeedbackPayload): string {
  const scope = getFeedbackScope(payload.dsn)

  const {message, name, email, source, sentiment, contactConsent, tags, attachments} = payload

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
