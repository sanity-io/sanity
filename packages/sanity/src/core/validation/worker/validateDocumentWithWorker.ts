import {type SanityClient} from '@sanity/client'
import {extractManifestSchemaTypes} from '@sanity/schema/_internal'
import {
  type CurrentUser,
  type SanityDocument,
  type Schema,
  type ValidationMarker,
} from '@sanity/types'
import {
  type DocumentValidationMarker,
  type DocumentValidationResult,
  validationMarkerCodes,
} from '@sanity/validation'
import {evaluateDocumentObservable, type LocaleSource} from '@sanity/validation/_internal'
import {dequal} from 'dequal/lite'
import {defer, Observable, type Subscriber} from 'rxjs'

import {type SourceClientOptions} from '../../config/types'
import {validateMainThreadRules} from './mainThreadRules'
import {type WorkerI18nResources} from './protocol'
import {createValidationWorkerClient, type ValidationWorkerClient} from './validationWorkerClient'

/** The parts of the studio's i18next instance the worker setup reads. */
export interface ValidationWorkerI18nSource {
  language: string
  getResourceBundle(language: string, namespace: string): unknown
}

/** @internal */
export interface ValidationWorkerContext {
  schema: Schema
  i18n: LocaleSource
  i18next: ValidationWorkerI18nSource
  getClient: (options: SourceClientOptions) => SanityClient
  currentUser?: Omit<CurrentUser, 'role'> | null
  /** Overridable for tests, which drive the host through a `MessageChannel` instead. */
  createWorker?: () => Parameters<typeof createValidationWorkerClient>[0]['port']
}

export interface ValidationWorkerRun {
  document: SanityDocument
  getDocumentExists: (options: {id: string; signal?: AbortSignal}) => Promise<boolean>
}

interface SchemaWorker {
  client: ValidationWorkerClient
  unsupportedTypes: Set<string>
}

const workers = new WeakMap<Schema, Promise<SchemaWorker | undefined>>()

function createDefaultWorker() {
  return new Worker(new URL('./validation.worker.ts', import.meta.url), {
    type: 'module',
    name: 'sanity-validation',
  })
}

function collectI18nResources(i18next: ValidationWorkerI18nSource): WorkerI18nResources {
  const bundle = i18next.getResourceBundle(i18next.language, 'validation')
  return {
    locale: i18next.language,
    resources:
      typeof bundle === 'object' && bundle !== null
        ? {[i18next.language]: bundle as Record<string, string>}
        : {},
  }
}

/**
 * One worker per schema, created on first use. Resolves to `undefined` when the worker cannot be
 * set up (no `Worker` global, a schema the manifest cannot express at all, a failing worker
 * script), in which case validation stays on the main thread for that schema. Document types the
 * worker had to leave out of its schema are validated on the main thread as well.
 */
function getSchemaWorker(ctx: ValidationWorkerContext): Promise<SchemaWorker | undefined> {
  const existing = workers.get(ctx.schema)
  if (existing) return existing

  const worker = (async () => {
    try {
      if (!ctx.createWorker && typeof Worker === 'undefined') return undefined
      const types = extractManifestSchemaTypes(ctx.schema)
      await ctx.i18n.loadNamespaces(['validation'])
      const client = createValidationWorkerClient({
        port: (ctx.createWorker ?? createDefaultWorker)(),
        schema: {name: ctx.schema.name, types},
        i18n: collectI18nResources(ctx.i18next),
      })
      const {unsupportedTypes} = await client.ready
      if (unsupportedTypes.length > 0) {
        console.warn(
          `Validation worker: the schema manifest cannot express ${unsupportedTypes.join(', ')}; documents of these types are validated on the main thread`,
        )
      }
      return {client, unsupportedTypes: new Set(unsupportedTypes)}
    } catch (error) {
      console.warn('Validation worker unavailable, validating on the main thread instead:', error)
      return undefined
    }
  })()
  workers.set(ctx.schema, worker)
  return worker
}

function toDocumentValidationMarker(marker: ValidationMarker): DocumentValidationMarker {
  return typeof marker.code === 'string'
    ? (marker as DocumentValidationMarker)
    : {...marker, code: validationMarkerCodes.validationFailed}
}

/**
 * Merges the worker's markers with the main thread's. A rule that mixes built-in and custom
 * constraints (or a slug's structure check) can be evaluated on both sides; identical markers
 * are kept once.
 */
export function mergeMarkers(
  workerMarkers: DocumentValidationMarker[],
  mainThreadMarkers: ValidationMarker[],
): DocumentValidationMarker[] {
  const buckets = new Map<string, DocumentValidationMarker[]>()
  const merged: DocumentValidationMarker[] = []
  for (const candidate of [
    ...workerMarkers,
    ...mainThreadMarkers.map(toDocumentValidationMarker),
  ]) {
    const key = JSON.stringify([candidate.level, candidate.code, candidate.message, candidate.path])
    const bucket = buckets.get(key)
    if (bucket?.some((existing) => dequal(existing, candidate))) continue
    if (bucket) bucket.push(candidate)
    else buckets.set(key, [candidate])
    merged.push(candidate)
  }
  return merged
}

/**
 * Validates a document with the built-in rules evaluated in a worker and the remaining rules on
 * the main thread, falling back to the regular in-thread pipeline when the worker is unavailable
 * or fails for a run.
 *
 * @internal
 */
export function evaluateDocumentWithWorker(
  ctx: ValidationWorkerContext,
  run: ValidationWorkerRun,
): Observable<DocumentValidationResult> {
  const inThread = () =>
    evaluateDocumentObservable({
      document: run.document,
      getClient: ctx.getClient,
      getDocumentExists: run.getDocumentExists,
      i18n: ctx.i18n,
      schema: ctx.schema,
      environment: 'studio',
      currentUser: ctx.currentUser,
    })

  return defer(
    () =>
      new Observable((subscriber: Subscriber<DocumentValidationResult>) => {
        const controller = new AbortController()
        const {signal} = controller

        const fallback = (reason: unknown) => {
          if (signal.aborted) return
          console.warn(
            'Validation worker failed for this run, validating on the main thread instead:',
            reason,
          )
          subscriber.add(inThread().subscribe(subscriber))
        }

        getSchemaWorker(ctx)
          .then(async (worker) => {
            if (signal.aborted) return
            if (!worker || worker.unsupportedTypes.has(run.document._type)) {
              subscriber.add(inThread().subscribe(subscriber))
              return
            }
            try {
              const [workerResult, mainThreadMarkers] = await Promise.all([
                worker.client.validate({
                  document: run.document,
                  currentUser: ctx.currentUser,
                  getDocumentExists: run.getDocumentExists,
                  getClient: ctx.getClient,
                  signal,
                }),
                validateMainThreadRules({
                  document: run.document,
                  schema: ctx.schema,
                  i18n: ctx.i18n,
                  getClient: ctx.getClient,
                  getDocumentExists: run.getDocumentExists,
                  currentUser: ctx.currentUser,
                  signal,
                }),
              ])
              if (signal.aborted) return
              const markers = mergeMarkers(workerResult.markers, mainThreadMarkers)
              subscriber.next({status: markers.length > 0 ? 'failed' : 'passed', markers})
              subscriber.complete()
            } catch (error) {
              fallback(error)
            }
          })
          .catch(fallback)

        return () => controller.abort()
      }),
  )
}
