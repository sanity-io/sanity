import {createClient, SanityClient} from '@sanity/client'
import {ConsentStatus, createBatchedStore, createSessionId, TelemetryEvent} from '@sanity/telemetry'
import {debug as baseDebug} from '../debug'
import {getCliToken} from './clientWrapper'

const debug = baseDebug.extend('telemetry')

function isTrueish(value: string | undefined) {
  if (value === undefined) return false
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  const number = parseInt(value, 10)
  if (isNaN(number)) return false
  return number > 0
}

const VALID_STATUSES: ConsentStatus[] = ['granted', 'denied', 'unset']
function parseConsent(value: string | undefined): ConsentStatus {
  if (!value) return 'unset'
  if (VALID_STATUSES.includes(value.toLowerCase() as any)) {
    return value as ConsentStatus
  }
  throw new Error(
    'Invalid value provided for environment variable MOCK_CONSENT. Must be either "0", "1", "true", "false", "granted", "denied" or "unset"',
  )
}

function createTelemetryClient(token: string) {
  const getClient = getClientWrapper(null, 'sanity.cli.js')
  return getClient({requireUser: false, requireProject: false}).config({
    // todo: change vX to stable
    apiVersion: 'vX',
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

export function createTelemetryStore(options: {env: {[key: string]: string | undefined}}) {
  debug('Initializing telemetry')
  const {env} = options

  function fetchConsent(client: SanityClient) {
    // @todo: remove mocking when stable
    if ('MOCK_CONSENT' in env) {
      return Promise.resolve({
        status: isTrueish(env.MOCK_CONSENT) ? 'granted' : parseConsent(env.MOCK_CONSENT),
      })
    }
    return client.request({uri: 'vX/users/me/consents/telemetry'})
  }

  function resolveConsent(): Promise<{status: ConsentStatus}> {
    debug('Resolving consent…')
    if (isTrueish(env.DO_NOT_TRACK)) {
      debug('DO_NOT_TRACK is set, consent is denied')
      return Promise.resolve({status: 'denied'})
    }
    const token = getCliToken()
    if (!token) {
      debug('User is not logged in, consent is undetermined')
      return Promise.resolve({status: 'undetermined'})
    }
    const client = getCachedClient(token)
    return fetchConsent(client)
      .then((response) => {
        debug('User consent status is %s', response.status)
        return {status: parseConsent(response.status)}
      })
      .catch((err) => {
        debug('Failed to fetch user consent status, treating it as "undetermined": %s', err.stack)
        return {status: 'undetermined'}
      })
  }

  // Note: if this function throws/rejects the events will be put back on the buffer
  async function sendEvents(batch: TelemetryEvent[]) {
    const token = getCliToken()
    if (!token) {
      // Note: since the telemetry store checks for consent before sending events, and this token
      // check is also done during consent checking, this would normally never happen
      debug('No user token found. Something is not quite right')
      return Promise.reject(new Error('User is not logged in'))
    }
    const client = getCachedClient(token)
    debug('Submitting %s telemetry events', batch.length)
    try {
      return await client.request({
        uri: '/intake/batch',
        method: 'POST',
        json: true,
        body: batch,
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

  const store = createBatchedStore(sessionId, {
    resolveConsent,
    sendEvents,
  })
  process.once('beforeExit', () => store.flush())
  return store.logger
}
