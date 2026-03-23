import {
  BrowserClient,
  defaultStackParser,
  getClient,
  getCurrentScope,
  init,
  isInitialized as sentryIsInitialized,
  makeFetchTransport,
  Scope,
} from '@sentry/react'

import {isDev} from '../environment'
import {SANITY_VERSION} from '../version'
import {type FeedbackPayload} from './types'

const FEEDBACK_DSN = 'https://8914c8dde7e1ebce191f15af8bf6b7b9@sentry.sanity.io/4507342122123264'

let feedbackClient: BrowserClient | undefined
let feedbackScope: Scope | undefined

function getFeedbackClient(): {client: BrowserClient; scope: Scope} {
  if (feedbackClient && feedbackScope) {
    return {client: feedbackClient, scope: feedbackScope}
  }

  if (!sentryIsInitialized()) {
    init({
      dsn: FEEDBACK_DSN,
      release: SANITY_VERSION,
      environment: isDev ? 'development' : 'production',
      defaultIntegrations: false,
      integrations: [],
      sendDefaultPii: true,
    })

    feedbackClient = getClient()
    feedbackScope = getCurrentScope()
  } else {
    feedbackClient = new BrowserClient({
      dsn: FEEDBACK_DSN,
      release: SANITY_VERSION,
      environment: isDev ? 'development' : 'production',
      stackParser: defaultStackParser,
      integrations: [],
      transport: makeFetchTransport,
    })

    feedbackScope = new Scope()
    feedbackScope.setClient(feedbackClient)
    feedbackClient.init()
  }

  return {client: feedbackClient!, scope: feedbackScope}
}

/**
 * Send user feedback to Sentry. Framework-agnostic — no React dependency.
 *
 * @internal
 */
export function sendFeedback(payload: FeedbackPayload): string {
  const {scope} = getFeedbackClient()

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
