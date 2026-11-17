import {type BrowserOptions, type Event} from '@sentry/react'

/**
 * Key fragments Sentry v10 denied when `sendDefaultPii` was left unset.
 * The v11 migration guide uses the same list for headers and query params.
 */
const PII_KEY_DENYLIST = ['forwarded', '-ip', 'remote-', 'via', '-user']

/**
 * v11 collects user info, cookies, headers, bodies, and query params unless
 * each category is turned off. Studio never set `sendDefaultPii`. This is the
 * restrictive posture from Sentry's v11 migration guide, plus `queues`, which
 * v11 collects by default and v10 did not have.
 *
 * `userInfo: false` also keeps Relay from inferring the client IP
 * (`infer_ip: "never"`).
 */
export const studioSentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: {deny: PII_KEY_DENYLIST},
    response: {deny: PII_KEY_DENYLIST},
  },
  httpBodies: [],
  urlQueryParams: {deny: PII_KEY_DENYLIST},
  genAI: {inputs: false, outputs: false},
  databaseQueryData: false,
  graphQL: {document: false, variables: false},
  queues: false,
} satisfies NonNullable<BrowserOptions['dataCollection']>

/**
 * Drops automatically attached identity and request data. Explicit feedback
 * fields on `contexts` and `tags` are left in place. The zeroed IP blocks
 * Sentry from filling one in from the ingest connection.
 */
export function scrubAutomaticPii<T extends Event>(event: T): T {
  delete event.user
  delete event.request

  // Prevent Sentry from inferring IP from the HTTP request
  event.user = {ip_address: '0.0.0.0'}

  return event
}
