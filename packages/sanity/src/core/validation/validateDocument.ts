import {
  isKeyedObject,
  isTypedObject,
  type Rule,
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
import {getTypeChain, normalizeValidationRules} from './util/normalizeValidationRules'
import type {ValidationContext} from './types'
import {createBatchedGetDocumentExists} from './util/createBatchedGetDocumentExists'
import {createClientConcurrencyLimiter} from './util/createClientConcurrencyLimiter'
import {ConcurrencyLimiter} from './util/ConcurrencyLimiter'
import {unknownFieldsValidator} from './validators/unknownFieldsValidator'

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

  /**
   * Specify the environment name. This will be passed down to the
   * `ValidationContext` and made available to custom validators.
   */
  environment?: 'cli' | 'studio'

  /**
   * The maximum amount of custom validation functions to be running
   * concurrently at once. This helps prevent custom validators from
   * overwhelming backend services (e.g. called via fetch) used in async,
   * user-defined validation functions. (i.e. `rule.custom(async() => {})`)
   */
  maxCustomValidationConcurrency?: number
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
  environment = 'studio',
  ...options
}: ValidateDocumentOptions): Promise<ValidationMarker[]> {
  const getClient = options.getClient || workspace.getClient
  const getConcurrencyLimitedClient = (clientOptions: SourceClientOptions) =>
    limitConcurrency(getClient(clientOptions))

  return lastValueFrom(
    validateDocumentObservable({
      document,
      getClient: getConcurrencyLimitedClient,
      i18n: workspace.i18n,
      schema: workspace.schema,
      getDocumentExists:
        options.getDocumentExists ||
        createBatchedGetDocumentExists(getClient({apiVersion: 'v2021-03-25'})),
      environment,
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
  environment: 'cli' | 'studio'
  maxCustomValidationConcurrency?: number
}

const customValidationConcurrencyLimiters = new WeakMap<Schema, ConcurrencyLimiter>()

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
  environment,
  maxCustomValidationConcurrency,
}: ValidateDocumentObservableOptions): Observable<ValidationMarker[]> {
  if (typeof document?._type !== 'string') {
    throw new Error(`Tried to validated a value without a '_type'`)
  }

  const documentType = schema.get(document._type)

  if (!documentType) {
    if (environment === 'studio') {
      console.warn(
        'Schema type for object type "%s" not found, skipping validation',
        document._type,
      )
      return of([])
    }

    return of([
      {
        level: 'warning',
        message: `Could not find schema type for type '${document._type}', skipping validation`,
        path: [],
      },
    ])
  }

  let customValidationConcurrencyLimiter = customValidationConcurrencyLimiters.get(schema)
  if (!customValidationConcurrencyLimiter && maxCustomValidationConcurrency) {
    customValidationConcurrencyLimiter = new ConcurrencyLimiter(maxCustomValidationConcurrency)
    customValidationConcurrencyLimiters.set(schema, customValidationConcurrencyLimiter)
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
    environment,
    customValidationConcurrencyLimiter,
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
  customValidationConcurrencyLimiter?: ConcurrencyLimiter
} & ExplicitUndefined<ValidationContext>

export function validateItem(opts: ValidateItemOptions): Promise<ValidationMarker[]> {
  return lastValueFrom(validateItemObservable(opts))
}

function validateItemObservable({
  value,
  type,
  path = [],
  parent,
  customValidationConcurrencyLimiter,
  environment,
  ...restOfContext
}: ValidateItemOptions): Observable<ValidationMarker[]> {
  // Note: this validator is added here because it's conditional based on the
  // environment.
  const addUnknownFieldsValidator = (rule: Rule) => {
    if (
      // if the schema type is an object type
      type?.jsonType === 'object' &&
      // and if somewhere in it's type chain, it inherits from object or document
      getTypeChain(type).find((t) => ['object', 'document', 'file', 'image'].includes(t.name)) &&
      // and the environment is not the studio
      environment !== 'studio'
    ) {
      // then add the validator for unknown fields
      return rule.custom(unknownFieldsValidator(type), {bypassConcurrencyLimit: true}).warning()
    }

    // otherwise, leave it unchanged
    return rule
  }

  const rules = normalizeValidationRules(type)
  // run validation for the current value
  const selfChecks = rules.map(addUnknownFieldsValidator).map((rule) =>
    defer(() =>
      rule.validate(value, {
        ...restOfContext,
        environment,
        parent,
        path,
        type,
        __internal: {customValidationConcurrencyLimiter},
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
          return normalizeValidationRules({...fieldType, validation})
            .map(addUnknownFieldsValidator)
            .map((subRule) => {
              const nestedValue = isRecord(value) ? value[name] : undefined
              return defer(() =>
                subRule.validate(nestedValue, {
                  ...restOfContext,
                  parent: value,
                  path: path.concat(name),
                  type: fieldType,
                  environment,
                  __internal: {customValidationConcurrencyLimiter},
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
          environment,
          customValidationConcurrencyLimiter,
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
          environment,
          customValidationConcurrencyLimiter,
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
