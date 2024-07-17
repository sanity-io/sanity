import {appendFile} from 'node:fs/promises'

import {type SanityClient} from '@sanity/client'
import {
  type ConsentStatus,
  createBatchedStore,
  createSessionId,
  type TelemetryEvent,
} from '@sanity/telemetry'

import {debug as baseDebug} from '../debug'
import {getClientWrapper, getCliToken} from './clientWrapper'
import {createExpiringConfig} from './createExpiringConfig'
import {getUserConfig} from './getUserConfig'
import {isCi} from './isCi'
import {isTrueish} from './isTrueish'

const debug = baseDebug.extend('telemetry')

const FIVE_MINUTES = 1000 * 60 * 5
const LOG_FILE_NAME = 'telemetry-events.ndjson'

export const TELEMETRY_CONSENT_CONFIG_KEY = 'telemetryConsent'

const VALID_API_STATUSES = ['granted', 'denied', 'unset'] as const
type ValidApiConsentStatus = (typeof VALID_API_STATUSES)[number]

function isValidApiConsentStatus(status: string): status is ValidApiConsentStatus {
  return VALID_API_STATUSES.includes(status as ValidApiConsentStatus)
}

function parseApiConsentStatus(value: unknown): ValidApiConsentStatus {
  if (typeof value === 'string' && isValidApiConsentStatus(value)) {
    return value
  }
  throw new Error(`Invalid consent status. Must be one of: ${VALID_API_STATUSES.join(', ')}`)
}

function createTelemetryClient(token: string) {
  const getClient = getClientWrapper(null, 'sanity.cli.js')
  return getClient({requireUser: false, requireProject: false}).config({
    apiVersion: '2023-12-18',
    token,
    useCdn: false,
    useProjectHostname: false,
  })
}

let _client: SanityClient | null = null
function getCachedClient(token: string) {
  if (!_client) {
    _client = createTelemetryClient(token)
  }
  return _client
}

interface Env {
  DO_NOT_TRACK?: string
  SANITY_TELEMETRY_INSPECT?: string
}

interface Options {
  env: Env | NodeJS.ProcessEnv
}

export type ConsentInformation =
  | {
      status: Extract<ConsentStatus, 'granted'>
      reason?: never
    }
  | {
      status: Extract<ConsentStatus, 'undetermined'>
      reason: 'unauthenticated' | 'fetchError'
    }
  | {
      status: Extract<ConsentStatus, 'denied'>
      reason?: 'localOverride'
    }
  | {
      status: Extract<ConsentStatus, 'unset'>
      reason?: never
    }

export function resolveConsent({env}: Options): Promise<ConsentInformation> {
  debug('Resolving consent…')
  if (isCi) {
    debug('CI environment detected, treating telemetry consent as denied')
    return Promise.resolve({status: 'denied'})
  }
  if (isTrueish(env.DO_NOT_TRACK)) {
    debug('DO_NOT_TRACK is set, consent is denied')
    return Promise.resolve({
      status: 'denied',
      reason: 'localOverride',
    })
  }

  const token = getCliToken()
  if (!token) {
    debug('User is not logged in, consent is undetermined')
    return Promise.resolve({
      status: 'undetermined',
      reason: 'unauthenticated',
    })
  }

  const client = getCachedClient(token)

  function fetchConsent(): Promise<{
    status: ValidApiConsentStatus
  }> {
    const telemetryConsentConfig = createExpiringConfig<{
      status: ValidApiConsentStatus
    }>({
      store: getUserConfig(),
      key: TELEMETRY_CONSENT_CONFIG_KEY,
      ttl: FIVE_MINUTES,
      fetchValue: () =>
        client.request({uri: '/intake/telemetry-status', tag: 'telemetry-consent.cli'}),
      onRevalidate() {
        debug('Revalidating cached telemetry consent status...')
      },
      onFetch() {
        debug('Fetching telemetry consent status...')
      },
      onCacheHit() {
        debug('Retrieved telemetry consent status from cache')
      },
    })
    return telemetryConsentConfig.get()
  }

  return fetchConsent()
    .then<ConsentInformation>((response) => {
      debug('User consent status is %s', response.status)
      return {status: parseApiConsentStatus(response.status)}
    })
    .catch((err) => {
      debug('Failed to fetch user consent status, treating it as "undetermined": %s', err.stack)
      return {
        status: 'undetermined',
        reason: 'fetchError',
      }
    })
}
export function createTelemetryStore<UserProperties>({
  env,
  projectId,
}: {
  projectId?: string
  env: {[key: string]: string | undefined}
}) {
  debug('Initializing telemetry')

  // Note: if this function throws/rejects the events will be put back on the buffer
  async function sendEvents(batch: TelemetryEvent[]) {
    const token = getCliToken()
    if (!token) {
      // Note: since the telemetry store checks for consent before sending events, and this token
      // check is also done during consent checking, this would normally never happen
      debug('No user token found. Something is not quite right')
      return Promise.reject(new Error('User is not logged in'))
    }
    const inspectEvents = isTrueish(env.SANITY_TELEMETRY_INSPECT)
    if (inspectEvents) {
      // eslint-disable-next-line no-console
      console.info(`SANITY_TELEMETRY_INSPECT is set, appending events to "${LOG_FILE_NAME}"`)
      await appendFile(LOG_FILE_NAME, `${batch.map((entry) => JSON.stringify(entry)).join('\n')}\n`)
    }
    const client = getCachedClient(token)
    debug('Submitting %s telemetry events', batch.length)
    try {
      return await client.request({
        uri: '/intake/batch',
        method: 'POST',
        json: true,
        body: {projectId, batch},
      })
    } catch (err) {
      const statusCode = err.response && err.response.statusCode
      debug(
        'Failed to send telemetry events%s: %s',
        statusCode ? ` (HTTP ${statusCode})` : '',
        err.stack,
      )
      // note: we want to throw - the telemetry store implements error handling already
      throw err
    }
  }

  const sessionId = createSessionId()
  debug('session id: %s', sessionId)

  const store = createBatchedStore<UserProperties>(sessionId, {
    resolveConsent: () => resolveConsent({env}),
    sendEvents,
  })

  process.once('SIGINT', () => store.flush().finally(() => process.exit(0)))
  process.once('beforeExit', () => store.flush())
  process.once('unhandledRejection', () => store.flush())
  process.once('uncaughtException', () => store.flush())
  return store
}
