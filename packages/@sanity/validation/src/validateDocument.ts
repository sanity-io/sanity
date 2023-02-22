import {
  SanityDocument,
  Schema,
  SchemaType,
  ValidationContext,
  ValidationMarker,
  isKeyedObject,
  isTypedObject,
  isBlockSchemaType,
  isSpanSchemaType,
  isPortableTextTextBlock,
} from '@sanity/types'
import {concat, defer, lastValueFrom, merge, Observable, of} from 'rxjs'
import {catchError, map, mergeAll, mergeMap, toArray} from 'rxjs/operators'
import {flatten, uniqBy} from 'lodash'
import typeString from './util/typeString'
import {cancelIdleCallback, requestIdleCallback} from './util/requestIdleCallback'
import ValidationErrorClass from './ValidationError'
import normalizeValidationRules from './util/normalizeValidationRules'

const isRecord = (maybeRecord: unknown): maybeRecord is Record<string, unknown> =>
  typeof maybeRecord === 'object' && maybeRecord !== null && !Array.isArray(maybeRecord)

const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

/**
 * @internal
 */
export function resolveTypeForArrayItem(
  item: unknown,
  candidates: SchemaType[]
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

export default async function validateDocument(
  getClient: ValidateItemOptions['getClient'],
  doc: SanityDocument,
  schema: Schema,
  context?: Pick<ValidationContext, 'getDocumentExists'>
): Promise<ValidationMarker[]> {
  return lastValueFrom(validateDocumentObservable(getClient, doc, schema, context))
}

export function validateDocumentObservable(
  getClient: ValidateItemOptions['getClient'],
  doc: SanityDocument,
  schema: Schema,
  context?: Pick<ValidationContext, 'getDocumentExists'>
): Observable<ValidationMarker[]> {
  const documentType = schema.get(doc._type)
  if (!documentType) {
    console.warn('Schema type for object type "%s" not found, skipping validation', doc._type)
    return of(EMPTY_MARKERS)
  }

  const validationOptions: ValidateItemOptions = {
    getClient,
    schema,
    parent: undefined,
    value: doc,
    path: [],
    document: doc,
    type: documentType,
    getDocumentExists: context?.getDocumentExists,
  }

  return validateItemObservable(validationOptions).pipe(
    catchError((err) => {
      console.error(err)
      return of([
        {
          type: 'validation' as const,
          level: 'error' as const,
          path: [],
          item: new ValidationErrorClass(err?.message),
        },
      ])
    })
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
      })
    )
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
              })
            )
          })
        })
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
        })
      )
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
        })
      )
    )
  }

  // markDefs also do no run nested validation if the parent object is undefined
  // for a similar reason to arrays
  const shouldRunNestedValidationForMarkDefs =
    isPortableTextTextBlock(value) && value.markDefs?.length && isBlockSchemaType(type)

  if (shouldRunNestedValidationForMarkDefs) {
    const [spanChildrenField] = type.fields
    const spanType = spanChildrenField.type.of.find(isSpanSchemaType)

    const annotations = (spanType?.annotations || []).reduce<Map<string, SchemaType>>(
      (acc, annotationType) => {
        acc.set(annotationType.name, annotationType)
        return acc
      },
      new Map()
    )

    nestedChecks = nestedChecks.concat(
      (value.markDefs || []).map((markDef) =>
        validateItemObservable({
          ...restOfContext,
          parent: value,
          value: markDef,
          path: path.concat(['markDefs', {_key: markDef._key}]),
          type: annotations.get(markDef._type),
        })
      )
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
    })
  )
}

function idle(timeout?: number): Observable<never> {
  return new Observable<never>((observer) => {
    const handle = requestIdleCallback(
      () => {
        observer.complete()
      },
      timeout ? {timeout} : undefined
    )

    return () => cancelIdleCallback(handle)
  })
}
