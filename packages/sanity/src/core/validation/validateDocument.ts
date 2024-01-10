import {
  isKeyedObject,
  isTypedObject,
  type SanityDocument,
  type Schema,
  type SchemaType,
  type ValidationMarker,
} from '@sanity/types'
import {concat, defer, from, lastValueFrom, merge, Observable, of} from 'rxjs'
import {catchError, map, mergeAll, mergeMap, switchMap, toArray} from 'rxjs/operators'
import {flatten, uniqBy} from 'lodash'
import type {SanityClient} from '@sanity/client'
import {getFallbackLocaleSource} from '../i18n/fallback'
import type {SourceClientOptions, Workspace} from '../config'
import {typeString} from './util/typeString'
import {cancelIdleCallback, requestIdleCallback} from './util/requestIdleCallback'
import {normalizeValidationRules} from './util/normalizeValidationRules'
import type {ValidationContext} from './types'
import {createBatchedGetDocumentExists} from './util/createBatchedGetDocumentExists'
import {createClientConcurrencyLimiter} from './util/createClientConcurrencyLimiter'

// this is the number of requests allowed inflight at once. this is done to prevent
// the validation library from overwhelming our backend
const MAX_FETCH_CONCURRENCY = 10

const limitConcurrency = createClientConcurrencyLimiter(MAX_FETCH_CONCURRENCY)

const isRecord = (maybeRecord: unknown): maybeRecord is Record<string, unknown> =>
  typeof maybeRecord === 'object' && maybeRecord !== null && !Array.isArray(maybeRecord)

const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

/**
 * @internal
 */
export function resolveTypeForArrayItem(
  item: unknown,
  candidates: SchemaType[],
): SchemaType | undefined {
  // if there is only one type available, assume that it's the correct one
  if (candidates.length === 1) return candidates[0]

  const itemType = isTypedObject(item) && item._type
  const primitive =
    item === undefined || item === null || (!itemType && typeString(item).toLowerCase())

  if (primitive && primitive !== 'object') {
    return candidates.find((candidate) => candidate.jsonType === primitive)
  }

  return (
    candidates.find((candidate) => candidate.type?.name === itemType) ||
    candidates.find((candidate) => candidate.name === itemType) ||
    candidates.find((candidate) => candidate.name === 'object' && primitive === 'object')
  )
}
const EMPTY_MARKERS: ValidationMarker[] = []

/**
 * @beta
 */
export interface ValidateDocumentOptions {
  /**
   * The document to be validated
   */
  document: SanityDocument
  /**
   * The workspace instance (and associated schema) used to validate the given
   * document against.
   */
  workspace: Workspace

  /**
   * Function used to check if referenced documents exists (and is published).
   *
   * If you're validating many documents in bulk, you may want to query for all
   * document IDs first and provide your own implementation using those.
   *
   * If no function is provided a default one will be provided that will batch
   * call the `doc` endpoint to check for document existence.
   */
  getDocumentExists?: (options: {id: string}) => Promise<boolean>

  /**
   * The factory function used to get a sanity client used in custom validators.
   * If not provided, the one from the workspace will be used (preferred).
   *
   * @deprecated For internal use only
   */
  getClient?: (clientOptions: SourceClientOptions) => SanityClient
}

/**
 * Validates a document against the schema in the given workspace. Returns an
 * array of validation markers with a path, message, and validation level.
 *
 * @beta
 */
export function validateDocument({
  document,
  workspace,
  ...options
}: ValidateDocumentOptions): Promise<ValidationMarker[]> {
  const getClient = options.getClient || workspace.getClient
  const getConcurrencyLimitedClient = (clientOptions: SourceClientOptions) =>
    limitConcurrency(getClient(clientOptions))

  return lastValueFrom(
    validateDocumentObservable({
      document,
      getClient: options.getClient || getConcurrencyLimitedClient,
      i18n: workspace.i18n,
      schema: workspace.schema,
      getDocumentExists:
        options.getDocumentExists ||
        createBatchedGetDocumentExists(getClient({apiVersion: 'v2021-03-25'})),
    }),
  )
}

/**
 * @internal
 */
export interface ValidateDocumentObservableOptions
  extends Pick<ValidationContext, 'getDocumentExists' | 'i18n'> {
  getClient: (options: {apiVersion: string}) => SanityClient
  document: SanityDocument
  schema: Schema
}

/**
 * Validates a document against the given schema, returning an Observable
 * @internal
 */
export function validateDocumentObservable({
  document,
  getClient,
  i18n = getFallbackLocaleSource(),
  schema,
  getDocumentExists,
}: ValidateDocumentObservableOptions): Observable<ValidationMarker[]> {
  const documentType = schema.get(document._type)
  if (!documentType) {
    console.warn('Schema type for object type "%s" not found, skipping validation', document._type)
    return of(EMPTY_MARKERS)
  }

  const validationOptions: ValidateItemOptions = {
    getClient,
    schema,
    parent: undefined,
    value: document,
    path: [],
    document: document,
    type: documentType,
    i18n,
    getDocumentExists,
  }

  return from(i18n.loadNamespaces(['validation'])).pipe(
    switchMap(() => validateItemObservable(validationOptions)),
    catchError((err) => {
      console.error(err)

      const message = err?.message || 'Unknown error'
      const errorMarker: ValidationMarker = {
        level: 'error',
        message,
        item: {message},
        path: [],
      }

      return of([errorMarker])
    }),
  )
}

/**
 * this is used make optional properties required by replacing optionals with
 * `T[P] | undefined`. this is used to prevent errors in `validateItem` where
 * an option from a previous invocation would be incorrectly passed down.
 *
 * https://medium.com/terria/typescript-transforming-optional-properties-to-required-properties-that-may-be-undefined-7482cb4e1585
 */
type ExplicitUndefined<T> = {
  [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined
}

type ValidateItemOptions = {
  value: unknown
} & ExplicitUndefined<ValidationContext>

export function validateItem(opts: ValidateItemOptions): Promise<ValidationMarker[]> {
  return lastValueFrom(validateItemObservable(opts))
}

function validateItemObservable({
  value,
  type,
  path = [],
  parent,
  ...restOfContext
}: ValidateItemOptions): Observable<ValidationMarker[]> {
  const rules = normalizeValidationRules(type)
  // run validation for the current value
  const selfChecks = rules.map((rule) =>
    defer(() =>
      rule.validate(value, {
        ...restOfContext,
        parent,
        path,
        type,
      }),
    ),
  )

  // run validation for nested values (conditionally)
  let nestedChecks: Array<Observable<ValidationMarker[]>> = []

  const selfIsRequired = rules.some((rule) => rule.isRequired())
  const shouldRunNestedObjectValidation =
    // run nested validation for objects
    type?.jsonType === 'object' &&
    // if the value is truthy
    (!!value || // or
      // (the value is null or undefined) and the top-level value is required
      ((value === null || value === undefined) && selfIsRequired))

  if (shouldRunNestedObjectValidation) {
    const fieldTypes = type.fields.reduce<Record<string, SchemaType>>((acc, field) => {
      acc[field.name] = field.type
      return acc
    }, {})

    // Validation for rules set at the object level with `Rule.fields({/* ... */})`
    nestedChecks = nestedChecks.concat(
      rules
        .map((rule) => rule._fieldRules)
        .filter(isNonNullable)
        .flatMap((fieldResults) => Object.entries(fieldResults))
        .flatMap(([name, validation]) => {
          const fieldType = fieldTypes[name]
          return normalizeValidationRules({...fieldType, validation}).map((subRule) => {
            const nestedValue = isRecord(value) ? value[name] : undefined
            return defer(() =>
              subRule.validate(nestedValue, {
                ...restOfContext,
                parent: value,
                path: path.concat(name),
                type: fieldType,
              }),
            )
          })
        }),
    )

    // Validation from each field's schema `validation: Rule => {/* ... */}` function
    nestedChecks = nestedChecks.concat(
      type.fields.map((field) =>
        validateItemObservable({
          ...restOfContext,
          parent: value,
          value: isRecord(value) ? value[field.name] : undefined,
          path: path.concat(field.name),
          type: field.type,
        }),
      ),
    )
  }

  // note: unlike objects, arrays should not run nested validation for undefined
  // values because we won't have a valid path to put a marker (i.e. missing the
  // key or index in the path) and the downstream form builder won't have a
  // valid target component
  const shouldRunNestedValidationForArrays = type?.jsonType === 'array' && Array.isArray(value)

  if (shouldRunNestedValidationForArrays) {
    nestedChecks = nestedChecks.concat(
      value.map((item, index) =>
        validateItemObservable({
          ...restOfContext,
          parent: value,
          value: item,
          path: path.concat(isKeyedObject(item) ? {_key: item._key} : index),
          type: resolveTypeForArrayItem(item, type.of),
        }),
      ),
    )
  }

  return defer(() => merge([...selfChecks, ...nestedChecks])).pipe(
    mergeMap((validateNode) => concat(idle(), validateNode), 40),
    mergeAll(),
    toArray(),
    map(flatten),
    map((results) => {
      // run `uniqBy` if `_fieldRules` are present because they can
      // cause repeat markers
      if (rules.some((rule) => rule._fieldRules)) {
        return uniqBy(results, (rule) => JSON.stringify(rule))
      }
      return results
    }),
  )
}

function idle(timeout?: number): Observable<never> {
  return new Observable<never>((observer) => {
    const handle = requestIdleCallback(
      () => {
        observer.complete()
      },
      timeout ? {timeout} : undefined,
    )

    return () => cancelIdleCallback(handle)
  })
}
