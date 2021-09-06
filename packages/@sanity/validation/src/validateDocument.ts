import {
  SanityDocument,
  Schema,
  SchemaType,
  Path,
  ValidationContext,
  ValidationMarker,
  isKeyedObject,
  isTypedObject,
  Rule,
  SchemaValidationValue,
} from '@sanity/types'
import typeString from './util/typeString'
import ValidationErrorClass from './ValidationError'
import RuleClass from './Rule'

const isRecord = (maybeRecord: unknown): maybeRecord is Record<string, unknown> =>
  typeof maybeRecord === 'object' && maybeRecord !== null && !Array.isArray(maybeRecord)

const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

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
  schema: Schema
): Promise<ValidationMarker[]> {
  const documentType = schema.get(doc._type)
  if (!documentType) {
    console.warn('Schema type for object type "%s" not found, skipping validation', doc._type)
    return []
  }

  try {
    return await validateItem({
      value: doc,
      type: documentType,
      path: [],
      context: {document: doc},
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

interface ValidateItemOptions {
  value: unknown
  type: SchemaType | undefined
  path: Path
  context: ValidationContext
}

const normalizeRules = (
  validation: SchemaValidationValue | undefined,
  type?: SchemaType
): Rule[] => {
  if (typeof validation === 'function') {
    return normalizeRules(validation(new RuleClass(type)))
  }
  if (!validation) return []
  if (Array.isArray(validation)) return normalizeRules(validation)
  return [validation]
}

export async function validateItem({
  value,
  type,
  path,
  context,
}: ValidateItemOptions): Promise<ValidationMarker[]> {
  const rules = normalizeRules(type?.validation, type)

  if (typeof type?.validation === 'function') {
    throw new Error(
      `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }

  const selfChecks = rules.map((rule) =>
    rule.validate(value, {
      parent: context.parent,
      document: context.document,
      path,
      type,
    })
  )

  const selfIsRequired = rules.some((rule) => rule.isRequired())

  let nestedResults: Array<Promise<ValidationMarker[]>> = []

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
    nestedResults = nestedResults.concat(
      rules
        .map((rule) => rule._fieldRules)
        .filter(isNonNullable)
        .flatMap((rule) => Object.entries(rule))
        .flatMap(([name, validation]) => {
          const fieldType = fieldTypes[name]
          return normalizeRules(validation, fieldType).map((subRule) => {
            const nestedValue = isRecord(value) ? value[name] : undefined
            return subRule.validate(nestedValue, {
              parent: value,
              document: context.document,
              path: path.concat(name),
              type: fieldType,
            })
          })
        })
    )

    // Validation from each field's schema `validation: Rule => {/* ... */}` function
    nestedResults = nestedResults.concat(
      type.fields.map((field) =>
        validateItem({
          value: isRecord(value) ? value[field.name] : undefined,
          type: field.type,
          path: path.concat(field.name),
          context,
        })
      )
    )
  }

  // note: unlike objects, arrays should not run nested validation for undefined
  // values because we won't have a valid path to put a marker (i.e. missing the
  // key or index in the path) and the downstream form builder won't have a
  // valid target component
  if (type?.jsonType === 'array' && Array.isArray(value)) {
    nestedResults = nestedResults.concat(
      value.map((item) =>
        validateItem({
          value: item,
          type: resolveTypeForArrayItem(item, type.of),
          path: path.concat(isKeyedObject(item) ? {_key: item._key} : item),
          context,
        })
      )
    )
  }

  const results = await Promise.all([...selfChecks, ...nestedResults])
  return results.flat()
}
