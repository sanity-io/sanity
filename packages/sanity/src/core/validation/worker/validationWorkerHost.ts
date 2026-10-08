import {type SanityClient} from '@sanity/client'
import {createSchemaFromManifestTypes} from '@sanity/schema/_internal'
import {type Schema} from '@sanity/types'
import {
  evaluateDocumentObservable,
  type LocaleSource,
  validationLocaleStrings,
} from '@sanity/validation/_internal'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- the worker has no studio i18n provider; it builds its own instance from resources the main thread sends
import {createInstance} from 'i18next'
import {lastValueFrom} from 'rxjs'

import {
  errorMessage,
  type MessagePortLike,
  type ValidationWorkerCall,
  type ValidationWorkerRequest,
  type ValidationWorkerResponse,
  type WorkerI18nResources,
} from './protocol'

type HostPort = MessagePortLike<ValidationWorkerRequest, ValidationWorkerResponse>

const FALLBACK_LOCALE = 'en-US'

/**
 * Runs document validation on the worker side of a message port.
 *
 * The worker only ever sees the manifest projection of the schema, which carries no user code,
 * so it validates with `customValidation: false`: built-in rules run here, while custom and
 * media validators, `Rule.fields()` and field references are left to the main thread. Reference
 * existence checks and client fetches are forwarded to the main thread over the same port.
 */
export function createValidationWorkerHost(port: HostPort): () => void {
  let schema: Schema | undefined
  let i18n: LocaleSource | undefined
  let nextCallId = 1
  const pendingCalls = new Map<
    number,
    {resolve: (value: unknown) => void; reject: (error: Error) => void}
  >()
  const runs = new Map<number, AbortController>()

  const createRunProxies = (requestId: number) => {
    const call = (request: ValidationWorkerCall): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const callId = nextCallId++
        pendingCalls.set(callId, {resolve, reject})
        port.postMessage({type: 'rpc', requestId, callId, ...request})
      })

    const getClient = ({apiVersion}: {apiVersion: string}): SanityClient => {
      const client = {
        fetch: (query: string, params?: unknown, options?: {tag?: string}) =>
          call({method: 'fetch', args: {apiVersion, query, params, tag: options?.tag}}),
        withConfig: (config?: {apiVersion?: string}) =>
          getClient({apiVersion: config?.apiVersion ?? apiVersion}),
        config: () => ({apiVersion}),
      }
      // Only `fetch` and `withConfig` are reachable from the built-in rules the worker runs
      // (slug uniqueness queries); custom validators, which could use the rest, never run here.
      return client as unknown as SanityClient
    }

    const getDocumentExists = async ({id}: {id: string}): Promise<boolean> =>
      Boolean(await call({method: 'getDocumentExists', args: {id}}))

    return {getClient, getDocumentExists}
  }

  const handleMessage = (event: {data: ValidationWorkerRequest}) => {
    const message = event.data
    switch (message.type) {
      case 'init': {
        try {
          schema = createSchemaFromManifestTypes({
            name: message.schema.name,
            types: prepareManifestTypesForWorker(message.schema.types),
          })
          i18n = createWorkerLocaleSource(message.i18n)
          port.postMessage({type: 'ready', requestId: message.requestId})
        } catch (error) {
          port.postMessage({
            type: 'error',
            requestId: message.requestId,
            message: errorMessage(error),
          })
        }
        return
      }
      case 'validate': {
        if (!schema || !i18n) {
          port.postMessage({
            type: 'error',
            requestId: message.requestId,
            message: 'Validation worker received a document before its schema',
          })
          return
        }
        const controller = new AbortController()
        runs.set(message.requestId, controller)
        const {getClient, getDocumentExists} = createRunProxies(message.requestId)
        lastValueFrom(
          evaluateDocumentObservable({
            document: message.document,
            schema,
            i18n,
            getClient,
            getDocumentExists,
            environment: 'studio',
            currentUser: message.currentUser,
            customValidation: false,
            signal: controller.signal,
          }),
        )
          .then((result) => {
            if (controller.signal.aborted) return
            port.postMessage({type: 'result', requestId: message.requestId, result})
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return
            port.postMessage({
              type: 'error',
              requestId: message.requestId,
              message: errorMessage(error),
            })
          })
          .finally(() => {
            runs.delete(message.requestId)
          })
        return
      }
      case 'cancel': {
        runs.get(message.requestId)?.abort()
        runs.delete(message.requestId)
        return
      }
      case 'rpcResult': {
        pendingCalls.get(message.callId)?.resolve(message.value)
        pendingCalls.delete(message.callId)
        return
      }
      case 'rpcError': {
        pendingCalls.get(message.callId)?.reject(new Error(message.message))
        pendingCalls.delete(message.callId)
        return
      }
      default: {
        const unknown: never = message
        throw new Error(`Unknown validation worker message: ${JSON.stringify(unknown)}`)
      }
    }
  }

  port.addEventListener('message', handleMessage)
  return () => {
    port.removeEventListener('message', handleMessage)
    for (const controller of runs.values()) controller.abort()
    runs.clear()
  }
}

function createWorkerLocaleSource({locale, resources}: WorkerI18nResources): LocaleSource {
  const i18n = createInstance({
    defaultNS: 'validation',
    fallbackLng: FALLBACK_LOCALE,
    initAsync: false,
    interpolation: {escapeValue: false},
    lng: locale,
    ns: ['validation'],
    resources: {
      [FALLBACK_LOCALE]: {validation: validationLocaleStrings},
      ...Object.fromEntries(
        Object.entries(resources).map(([id, bundle]) => [
          id,
          {
            validation: id === FALLBACK_LOCALE ? {...validationLocaleStrings, ...bundle} : bundle,
          },
        ]),
      ),
    },
    supportedLngs: Array.from(new Set([FALLBACK_LOCALE, locale, ...Object.keys(resources)])),
  })
  void i18n.init()
  return {
    currentLocale: {id: locale},
    loadNamespaces: (namespaces) => i18n.loadNamespaces(namespaces),
    t: i18n.t,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const COMBINATOR_FLAGS = new Set(['all', 'either'])

/**
 * Adjusts manifest types for a context that runs built-in rules only:
 *
 * - `hidden` and `readOnly` callbacks are serialized as the string `'conditional'`, which the
 *   validation context cannot evaluate. No built-in rule reads `hidden`, so the markers are
 *   dropped and the fields are treated as visible.
 * - Slug uniqueness is marked custom on every slug, so the worker skips it (it runs as a
 *   custom validator and those are off here). The main thread runs the real check, with the
 *   studio's `isUnique` option when one is configured.
 * - `all` / `either` rules are removed: `createSchemaFromManifestTypes` rebuilds their children as
 *   rule-building functions rather than rules, which the validation engine cannot evaluate. The
 *   main thread runs every combinator rule instead.
 */
export function prepareManifestTypesForWorker(types: unknown[]): unknown[] {
  const slugTypeNames = new Set(['slug'])
  // Named types that extend slug (directly or through another named type) also carry uniqueness.
  let added = true
  while (added) {
    added = false
    for (const type of types) {
      if (!isRecord(type) || typeof type.name !== 'string' || typeof type.type !== 'string') {
        continue
      }
      if (slugTypeNames.has(type.type) && !slugTypeNames.has(type.name)) {
        slugTypeNames.add(type.name)
        added = true
      }
    }
  }

  const skipUniqueness = () => true

  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit)
    if (!isRecord(value)) return value
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if ((key === 'hidden' || key === 'readOnly') && entry === 'conditional') continue
      if (key === 'validation' && Array.isArray(entry)) {
        const groups = entry
          .map((group) =>
            isRecord(group) && Array.isArray(group.rules)
              ? {
                  ...group,
                  rules: group.rules.filter(
                    (rule) =>
                      !(
                        isRecord(rule) &&
                        typeof rule.flag === 'string' &&
                        COMBINATOR_FLAGS.has(rule.flag)
                      ),
                  ),
                }
              : group,
          )
          .filter(
            (group) => !isRecord(group) || !Array.isArray(group.rules) || group.rules.length > 0,
          )
        if (groups.length > 0) result[key] = groups
        continue
      }
      result[key] = visit(entry)
    }
    if (typeof result.type === 'string' && slugTypeNames.has(result.type)) {
      result.options = {
        ...(isRecord(result.options) ? result.options : {}),
        isUnique: skipUniqueness,
      }
    }
    return result
  }

  return types.map(visit)
}
