import {
  SanityDocument,
  Schema,
  SchemaType,
  ValidationContext,
  ValidationMarker,
  isKeyedObject,
  isTypedObject,
  isBlock,
  isBlockSchemaType,
  isSpanSchemaType,
} from '@sanity/types'
import {uniqBy} from 'lodash'
import typeString from './util/typeString'
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

export default async function validateDocument(
  doc: SanityDocument,
  schema: Schema,
  context?: Pick<ValidationContext, 'getDocumentExists'>
): Promise<ValidationMarker[]> {
  const documentType = schema.get(doc._type)
  if (!documentType) {
    console.warn('Schema type for object type "%s" not found, skipping validation', doc._type)
    return []
  }

  try {
    return await validateItem({
      parent: undefined,
      value: doc,
      path: [],
      document: doc,
      type: documentType,
      getDocumentExists: context?.getDocumentExists,
    })
  } catch (err) {
    console.error(err)
    return [
      {
        type: 'validation',
        level: 'error',
        path: [],
        item: new ValidationErrorClass(err?.message),
      },
    ]
  }
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

export async function validateItem({
  value,
  type,
  path = [],
  parent,
  ...restOfContext
}: ValidateItemOptions): Promise<ValidationMarker[]> {
  const rules = normalizeValidationRules(type)

  // run validation for the current value
  const selfChecks = rules.map((rule) =>
    rule.validate(value, {
      ...restOfContext,
      parent,
      path,
      type,
    })
  )

  // run validation for nested values (conditionally)
  let nestedChecks: Array<Promise<ValidationMarker[]>> = []

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
            return subRule.validate(nestedValue, {
              ...restOfContext,
              parent: value,
              path: path.concat(name),
              type: fieldType,
            })
          })
        })
    )

    // Validation from each field's schema `validation: Rule => {/* ... */}` function
    nestedChecks = nestedChecks.concat(
      type.fields.map((field) =>
        validateItem({
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
      value.map((item) =>
        validateItem({
          ...restOfContext,
          parent: value,
          value: item,
          path: path.concat(isKeyedObject(item) ? {_key: item._key} : value.indexOf(item)),
          type: resolveTypeForArrayItem(item, type.of),
        })
      )
    )
  }

  // markDefs also do no run nested validation if the parent object is undefined
  // for a similar reason to arrays
  const shouldRunNestedValidationForMarkDefs =
    isBlock(value) && value.markDefs.length && isBlockSchemaType(type)

  if (shouldRunNestedValidationForMarkDefs) {
    const [spanChildrenField] = type.fields
    const spanType = spanChildrenField.type.of.find(isSpanSchemaType)

    const annotations = (spanType?.annotations || []).reduce<Map<string, SchemaType>>(
      (map, annotationType) => {
        map.set(annotationType.name, annotationType)
        return map
      },
      new Map()
    )

    nestedChecks = nestedChecks.concat(
      value.markDefs.map((markDef) =>
        validateItem({
          ...restOfContext,
          parent: value,
          value: markDef,
          path: path.concat(['markDefs', {_key: markDef._key}]),
          type: annotations.get(markDef._type),
        })
      )
    )
  }

  const results = (await Promise.all([...selfChecks, ...nestedChecks])).flat()

  // run `uniqBy` if `_fieldRules` are present because they can
  // cause repeat markers
  if (rules.some((rule) => rule._fieldRules)) {
    return uniqBy(results, (rule) => JSON.stringify(rule))
  }

  return results
}
