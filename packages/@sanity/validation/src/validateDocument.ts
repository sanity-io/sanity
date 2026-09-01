/* oxlint-disable typescript/no-deprecated -- marker and Rule compatibility require legacy internals */
import {type SanityClient} from '@sanity/client'
import {
  isKeyedObject,
  isTypedObject,
  type CurrentUser,
  type Rule,
  type SanityDocument,
  type Schema,
  type SchemaType,
  type SkippedValidation,
  type ValidationMarker,
} from '@sanity/types'
import {createClientConcurrencyLimiter} from '@sanity/util/client'
import {ConcurrencyLimiter} from '@sanity/util/concurrency-limiter'
import {dequal as isEqual} from 'dequal/lite'
import flatten from 'lodash-es/flatten.js'
import uniqWith from 'lodash-es/uniqWith.js'
import {concat, defer, from, lastValueFrom, merge, Observable, of} from 'rxjs'
import {catchError, map, mergeAll, mergeMap, switchMap, toArray} from 'rxjs/operators'

import {ClientUnavailableError} from './clientUnavailable'
import {type DocumentValidationMarker, validationMarkerCodes} from './codes'
import {getFallbackLocaleSource} from './i18n/fallback'
import {type LocaleSource} from './i18n/types'
import {resolveConditionalProperty} from './resolveConditionalProperty'
import {type ValidationContext} from './types'
import {createBatchedGetDocumentExists} from './util/createBatchedGetDocumentExists'
import {getTypeChain, normalizeValidationRules} from './util/normalizeValidationRules'
import {cancelIdleCallback, requestIdleCallback} from './util/requestIdleCallback'
import {typeString} from './util/typeString'
import {markValidator} from './validatorMetadata'
import {unknownFieldsValidator} from './validators/unknownFieldsValidator'

// this is the number of requests allowed inflight at once. this is done to prevent
// the validation library from overwhelming our backend.
// NOTE: this was upped from 10 to prevent issues where many concurrency
// `client.fetch` requests would "clog" custom validators from finishing due to
// not enough concurrent requests being fulfilled
//
// NOTE: ensure to update the TSDoc and CLI help test if this is changed
const DEFAULT_MAX_FETCH_CONCURRENCY = 25

// NOTE: ensure to update the TSDoc and CLI help test if this is changed
const DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY = 5

const DEFAULT_VALIDATION_CLIENT_OPTIONS = {apiVersion: '2025-02-19'} as const

const isRecord = (maybeRecord: unknown): maybeRecord is Record<string, unknown> =>
  typeof maybeRecord === 'object' && maybeRecord !== null && !Array.isArray(maybeRecord)

/**
 * Recursively extracts all `_fieldRules` from a rule and its nested constraints.
 * This handles cases where `Rule.fields()` is used inside `Rule.all()` or `Rule.either()`.
 */
function extractFieldRulesFromRule(rule: Rule): NonNullable<Rule['_fieldRules']>[] {
  const results: NonNullable<Rule['_fieldRules']>[] = []

  // Add direct _fieldRules if present
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  if (rule._fieldRules) {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    results.push(rule._fieldRules)
  }

  // Check for nested rules in 'all' or 'either' constraints
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  for (const ruleSpec of rule._rules) {
    if (ruleSpec.flag === 'all' || ruleSpec.flag === 'either') {
      const childRules = ruleSpec.constraint
      if (Array.isArray(childRules)) {
        for (const childRule of childRules) {
          results.push(...extractFieldRulesFromRule(childRule))
        }
      }
    }
  }

  return results
}

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
  /** The compiled schema to validate against. */
  schema: ValidationSchema

  /**
   * A configured client used for reference checks, slug uniqueness checks, and custom validators.
   * When omitted, checks that need a client are reported as not evaluated.
   */
  client?: ValidationClient

  /** Whether to run user-defined custom validators. Defaults to `true`. */
  customValidation?: boolean

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
   * The maximum amount of custom validation functions to be running
   * concurrently at once. This helps prevent custom validators from
   * overwhelming backend services (e.g. called via fetch) used in async,
   * user-defined validation functions. (i.e. `rule.custom(async() => {})`)
   *
   * Note that lowering this number may also help in cases where a custom
   * validator could potentially exhaust the fetch concurrency. This is 5 by
   * default.
   */
  maxCustomValidationConcurrency?: number

  /**
   * The amount of allowed inflight fetch requests at once for this validation.
   * You may need to up this value if you have complex custom validations that
   * require many `client.fetch` requests at once. It's possible for a custom
   * validator to stall if there are not enough concurrent fetch requests
   * available to fulfill the custom validation. Must be a positive integer.
   * This is 25 by default.
   */
  maxFetchConcurrency?: number

  /**
   * The current user, when available. Used when resolving schema `hidden`
   * conditionals so validation matches what the form shows. If omitted, hidden
   * is resolved with no user (e.g. CLI or headless validation).
   */
  currentUser?: Omit<CurrentUser, 'role'> | null
}

/** A compiled schema accepted across compatible `@sanity/types` versions. @beta */
export interface ValidationSchema {
  get(name: string): unknown
}

/**
 * A configured Sanity client accepted across compatible client versions.
 *
 * This structural type describes the capabilities used internally by validation.
 * The configured client is exposed to custom validators as a `SanityClient`, so it must be compatible with the full client API.
 *
 * @beta
 */
export interface ValidationClient {
  fetch: SanityClient['fetch']
  getDataUrl: SanityClient['getDataUrl']
  observable: Pick<SanityClient['observable'], 'fetch' | 'request'>
  withConfig(config: Parameters<SanityClient['withConfig']>[0]): ValidationClient
}

/** The result of validating a complete document. @beta */
export interface DocumentValidationResult {
  /** Whether validation passed, failed, or could not be fully evaluated. */
  status: 'passed' | 'failed' | 'notEvaluated'
  /** Validation rules that failed. */
  markers: DocumentValidationMarker[]
  /** Validation checks that could not be evaluated. */
  skipped: SkippedValidation[]
}

/**
 * The validation capabilities required from a resolved Studio source or workspace.
 *
 * @beta
 */
export interface ValidationSource {
  /** The compiled schema to validate against. */
  schema: Schema

  /** Factory used to get the client passed to custom validators. */
  getClient: (clientOptions: {apiVersion: string}) => SanityClient

  /** Internationalization utilities used for validation messages. */
  i18n: LocaleSource
}

/**
 * Options accepted by the compatibility overload for Studio workspace validation.
 *
 * @beta
 */
export interface ValidateDocumentWorkspaceOptions extends Omit<
  ValidateDocumentOptions,
  'client' | 'schema'
> {
  /** The resolved Studio workspace or source used for validation. */
  workspace: ValidationSource

  /**
   * Factory used to get the client passed to custom validators.
   *
   * @deprecated For internal use only
   */
  getClient?: ValidationSource['getClient']

  /** Validation environment exposed to custom validators. */
  environment?: 'cli' | 'studio'
}

/**
 * Validates a document against the schema in a resolved Studio workspace or source.
 *
 * @beta
 * @deprecated Prefer {@link validateDocument} with `{document, schema, client}` for new code.
 */
export function validateDocumentWithWorkspace({
  document,
  workspace,
  getClient = workspace.getClient,
  getDocumentExists,
  environment = 'studio',
  maxCustomValidationConcurrency,
  maxFetchConcurrency,
  currentUser,
}: ValidateDocumentWorkspaceOptions): Promise<DocumentValidationMarker[]> {
  return validateDocumentInternal({
    currentUser,
    document,
    environment,
    getClient,
    getDocumentExists,
    i18n: workspace.i18n,
    maxCustomValidationConcurrency,
    maxFetchConcurrency,
    schema: workspace.schema,
  })
}

/**
 * Validates a document against a compiled schema. Returns failed and skipped checks
 * without deciding whether the document may be edited or published.
 *
 * @beta
 */
export function validateDocument(
  options: ValidateDocumentOptions,
): Promise<DocumentValidationResult> {
  const {client, document, schema, ...internalOptions} = options
  return evaluateDocumentInternal({
    ...internalOptions,
    document,
    environment: 'cli',
    getClient: client
      ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- runtime-compatible clients may come from another major
        ({apiVersion}) => client.withConfig({apiVersion}) as SanityClient
      : () => {
          throw new ClientUnavailableError()
        },
    hasClient: Boolean(client),
    i18n: getFallbackLocaleSource(),
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- compiled schemas may come from another compatible package version
    schema: schema as Schema,
  })
}

/** @internal */
export interface ValidateDocumentInternalOptions {
  document: SanityDocument
  schema: Schema
  getClient: (clientOptions: {apiVersion: string}) => SanityClient
  getDocumentExists?: (options: {id: string}) => Promise<boolean>
  i18n?: LocaleSource
  environment: 'cli' | 'studio'
  maxCustomValidationConcurrency?: number
  maxFetchConcurrency?: number
  currentUser?: Omit<CurrentUser, 'role'> | null
  customValidation?: boolean
  hasClient?: boolean
}

function createDocumentValidationResult(
  markers: ValidationMarker[],
  skipped: SkippedValidation[],
): DocumentValidationResult {
  return {
    status: getDocumentValidationStatus(markers, skipped),
    markers: markers.map(toDocumentValidationMarker),
    skipped: uniqWith(skipped, isEqual),
  }
}

function getDocumentValidationStatus(
  markers: ValidationMarker[],
  skipped: SkippedValidation[],
): DocumentValidationResult['status'] {
  if (markers.length > 0) return 'failed'
  if (skipped.length > 0) return 'notEvaluated'
  return 'passed'
}

/** @internal */
export function validateDocumentInternal(
  options: ValidateDocumentInternalOptions,
): Promise<DocumentValidationMarker[]> {
  return evaluateDocumentInternal(options).then(({markers}) => markers)
}

/** @internal */
export function evaluateDocumentInternal({
  document,
  schema,
  getClient,
  getDocumentExists,
  i18n = getFallbackLocaleSource(),
  environment,
  maxCustomValidationConcurrency,
  maxFetchConcurrency,
  currentUser,
  customValidation = true,
  hasClient = true,
}: ValidateDocumentInternalOptions): Promise<DocumentValidationResult> {
  const limitConcurrency = createClientConcurrencyLimiter(
    maxFetchConcurrency ?? DEFAULT_MAX_FETCH_CONCURRENCY,
  )
  const getConcurrencyLimitedClient = (clientOptions: {apiVersion: string}) =>
    limitConcurrency(getClient(clientOptions))

  return lastValueFrom(
    evaluateDocumentObservable({
      document,
      getClient: getConcurrencyLimitedClient,
      i18n,
      schema,
      getDocumentExists:
        getDocumentExists ||
        (hasClient
          ? createBatchedGetDocumentExists(getClient(DEFAULT_VALIDATION_CLIENT_OPTIONS))
          : undefined),
      environment,
      maxCustomValidationConcurrency,
      currentUser,
      customValidation,
      hasClient,
    }),
  )
}

/**
 * @internal
 */
export interface ValidateDocumentObservableOptions extends Pick<
  ValidationContext,
  'getDocumentExists' | 'i18n'
> {
  getClient: (options: {apiVersion: string}) => SanityClient
  document: SanityDocument
  schema: Schema
  environment: 'cli' | 'studio'
  maxCustomValidationConcurrency?: number
  currentUser?: Omit<CurrentUser, 'role'> | null
  customValidation?: boolean
  hasClient?: boolean
}

const customValidationConcurrencyLimiters = new WeakMap<Schema, ConcurrencyLimiter>()

/**
 * Validates a document against the given schema, returning an Observable
 * @internal
 */
export function validateDocumentObservable(
  options: ValidateDocumentObservableOptions,
): Observable<DocumentValidationMarker[]> {
  return evaluateDocumentObservable(options).pipe(map(({markers}) => markers))
}

/**
 * Validates a document against the given schema, returning failed and skipped checks.
 * @internal
 */
export function evaluateDocumentObservable({
  document,
  getClient,
  i18n = getFallbackLocaleSource(),
  schema,
  getDocumentExists,
  environment,
  maxCustomValidationConcurrency,
  currentUser,
  customValidation = true,
  hasClient = true,
}: ValidateDocumentObservableOptions): Observable<DocumentValidationResult> {
  if (typeof document?._type !== 'string') {
    throw new Error(`Tried to validate a value without a '_type'`)
  }

  const documentType = schema.get(document._type)

  if (!documentType) {
    if (environment === 'studio') {
      console.warn(
        'Schema type for object type "%s" not found, skipping validation',
        document._type,
      )
      return of(createDocumentValidationResult([], []))
    }

    return of(
      createDocumentValidationResult(
        [
          {
            code: validationMarkerCodes.documentUnknownType,
            details: {documentType: document._type},
            level: 'warning',
            message: `Could not find schema type for type '${document._type}', skipping validation`,
            path: [],
          },
        ],
        [],
      ),
    )
  }

  let customValidationConcurrencyLimiter = customValidationConcurrencyLimiters.get(schema)
  if (!customValidationConcurrencyLimiter) {
    customValidationConcurrencyLimiter = new ConcurrencyLimiter(
      maxCustomValidationConcurrency ?? DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY,
    )
    customValidationConcurrencyLimiters.set(schema, customValidationConcurrencyLimiter)
  }

  return defer(() => {
    const skipped: SkippedValidation[] = []
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
      currentUser,
      customValidation,
      hasClient,
      __internal: undefined,
      onSkipped: (value) => {
        skipped.push(value)
      },
    }

    return from(i18n.loadNamespaces(['validation'])).pipe(
      switchMap(() => validateItemObservable(validationOptions)),
      map((markers) => createDocumentValidationResult(markers, skipped)),
      catchError((err) => {
        console.error(err)

        const message = err?.message || 'Unknown error'
        const errorMarker: DocumentValidationMarker = {
          code: validationMarkerCodes.validationException,
          level: 'error',
          message,
          item: {message},
          path: [],
        }

        return of(createDocumentValidationResult([errorMarker], skipped))
      }),
    )
  })
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
  hidden?: boolean
  currentUser?: Omit<CurrentUser, 'role'> | null
  customValidation?: boolean
  hasClient?: boolean
  onSkipped?: (skipped: SkippedValidation) => void
} & ExplicitUndefined<Omit<ValidationContext, 'hidden'>>

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
  customValidation = true,
  hasClient = true,
  onSkipped,
  ...restOfContext
}: ValidateItemOptions): Observable<ValidationMarker[]> {
  // Track whether any ancestor in the tree is hidden.
  // It will be true if this field OR any ancestor is hidden.
  // This allows validation rules to check `context.hidden` to skip validation for hidden fields,
  // without needing to know whether the field itself or an ancestor caused it to be hidden.
  const ancestorHidden = restOfContext.hidden === true
  const resolveHiddenForType = (
    schemaType: SchemaType | undefined,
    schemaValue: unknown,
    schemaParent: unknown,
    schemaPath: ValidationContext['path'],
    ancestorHiddenValue: boolean,
  ) => {
    // If there is no schema type, fall back to the ancestor's hidden state.
    if (!schemaType) {
      return ancestorHiddenValue
    }
    return (
      ancestorHiddenValue ||
      resolveConditionalProperty(schemaType.hidden, {
        ...restOfContext,
        parent: schemaParent,
        value: schemaValue,
        path: schemaPath || [],
        currentUser: restOfContext.currentUser ?? null,
      })
    )
  }
  const hidden = resolveHiddenForType(type, value, parent, path, ancestorHidden)

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
      return rule
        .custom(markValidator(unknownFieldsValidator(type), 'internal'), {
          bypassConcurrencyLimit: true,
        })
        .warning()
    }

    // otherwise, leave it unchanged
    return rule
  }

  const rules = normalizeValidationRules(type, {
    ...restOfContext,
    hidden,
    environment,
    parent,
    path,
    type,
  })
  // run validation for the current value
  const selfChecks = rules.map(addUnknownFieldsValidator).map((rule) =>
    defer(() =>
      rule.validate(value, {
        ...restOfContext,
        environment,
        hidden,
        parent,
        path,
        type,
        __internal: {
          customValidation,
          customValidationConcurrencyLimiter,
          hasClient,
          onSkipped,
        },
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
    // Use extractFieldRulesFromRule to handle Rule.fields() inside Rule.all() or Rule.either()
    nestedChecks = nestedChecks.concat(
      rules
        .flatMap((rule) => extractFieldRulesFromRule(rule))
        .flatMap((fieldResults) => Object.entries(fieldResults))
        .flatMap(([name, validation]) => {
          const fieldType = fieldTypes[name]
          return normalizeValidationRules({...fieldType, validation})
            .map(addUnknownFieldsValidator)
            .map((subRule) => {
              const nestedValue = isRecord(value) ? value[name] : undefined
              const nestedHidden = resolveHiddenForType(
                fieldType,
                nestedValue,
                value,
                path.concat(name),
                hidden,
              )
              return defer(() =>
                subRule.validate(nestedValue, {
                  ...restOfContext,
                  parent: value,
                  path: path.concat(name),
                  type: fieldType,
                  environment,
                  hidden: nestedHidden,
                  __internal: {
                    customValidation,
                    customValidationConcurrencyLimiter,
                    hasClient,
                    onSkipped,
                  },
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
          hidden,
          parent: value,
          value: isRecord(value) ? value[field.name] : undefined,
          path: path.concat(field.name),
          type: field.type,
          environment,
          customValidationConcurrencyLimiter,
          customValidation,
          hasClient,
          onSkipped,
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
          hidden,
          parent: value,
          value: item,
          path: path.concat(isKeyedObject(item) ? {_key: item._key} : index),
          type: resolveTypeForArrayItem(item, type.of),
          environment,
          customValidationConcurrencyLimiter,
          customValidation,
          hasClient,
          onSkipped,
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
      // Deduplicate markers when `_fieldRules` are present because they can
      // cause repeat markers (check recursively for nested rules)
      if (rules.some((rule) => extractFieldRulesFromRule(rule).length > 0)) {
        return deduplicateMarkers(results)
      }
      return results
    }),
  )
}

function deduplicateMarkers(markers: ValidationMarker[]): ValidationMarker[] {
  const buckets = new Map<string, ValidationMarker[]>()

  return markers.filter((marker) => {
    const key = JSON.stringify([marker.level, marker.code, marker.message, marker.path])
    const bucket = buckets.get(key)
    if (!bucket) {
      buckets.set(key, [marker])
      return true
    }

    if (bucket.some((existing) => isEqual(existing, marker))) return false

    bucket.push(marker)
    return true
  })
}

function hasValidationMarkerCode(marker: ValidationMarker): marker is DocumentValidationMarker {
  return typeof marker.code === 'string'
}

function toDocumentValidationMarker(marker: ValidationMarker): DocumentValidationMarker {
  if (hasValidationMarkerCode(marker)) return marker

  return {
    ...marker,
    code: validationMarkerCodes.validationFailed,
  }
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
