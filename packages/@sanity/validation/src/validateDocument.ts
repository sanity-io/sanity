import {
  SanityDocument,
  Schema,
  SchemaType,
  ObjectSchemaType,
  ArraySchemaType,
  Path,
  PathSegment,
  FieldRules,
  ValidationContext,
  ValidationMarker,
  isKeyedObject,
  isTypedObject,
} from '@sanity/types'
import typeString from './util/typeString'
import ValidationErrorClass from './ValidationError'
import RuleClass from './Rule'

const appendPath = (base: Path, next: Path | PathSegment): Path => base.concat(next)

export function resolveTypeForArrayItem(
  item: unknown,
  candidates: SchemaType[]
): SchemaType | undefined {
  // if there is only one type available, assume that it's the correct one
  if (candidates.length === 1) {
    return candidates[0]
  }

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
    return await validateItem(doc, documentType, [], {document: doc})
  } catch (err) {
    console.error(err)
    return [
      {
        type: 'validation',
        level: 'error',
        path: [],
        item: new ValidationErrorClass(err.message),
      },
    ]
  }
}

export function validateItem(
  item: unknown,
  type: SchemaType | undefined,
  path: Path,
  context: ValidationContext
): Promise<ValidationMarker[]> {
  if (Array.isArray(item) && type?.jsonType === 'array') {
    return validateArray(item, type, path, context)
  }

  if (typeof item === 'object' && item !== null && type?.jsonType === 'object') {
    return validateObject(item as Record<string, unknown>, type, path, context)
  }

  return validatePrimitive(item, type, path, context)
}

async function validateObject(
  obj: Record<string, unknown>,
  type: ObjectSchemaType | undefined,
  path: Path,
  context: ValidationContext
): Promise<ValidationMarker[]> {
  if (!type) {
    return []
  }

  if (typeof type.validation === 'function') {
    throw new Error(
      `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }

  // Run validation for the object itself
  const objChecks = (type.validation || []).map((rule) =>
    rule.validate(obj, {
      parent: context.parent,
      document: context.document,
      path,
      type,
    })
  )

  // Run validation for rules set at the object level with `Rule.fields({/* ... */})`
  const fieldRules = (type.validation || [])
    .map((rule) => rule._fieldRules)
    .filter(Boolean)
    // TODO: this seems like a bug, what if multiple rules touch the same field key?
    .reduce<FieldRules>(Object.assign, {})

  const fieldChecks = type.fields.map((field) => {
    // field validation from the enclosing object type
    const fieldValidation = fieldRules[field.name]
    if (!fieldValidation) {
      return []
    }
    const fieldPath = appendPath(path, field.name)
    const fieldValue = obj[field.name]

    return fieldValidation(new RuleClass()).validate(fieldValue, {
      parent: obj,
      document: context.document,
      path: fieldPath,
      type: field.type,
    })
  })

  // Run validation from each field's schema `validation: Rule => {/* ... */}` function
  const fieldTypeChecks = type.fields.map((field) => {
    // field validation from field type
    const fieldPath = appendPath(path, field.name)
    const fieldValue = obj[field.name]
    if (!field.type?.validation) {
      return []
    }
    return validateItem(fieldValue, field.type, fieldPath, {
      parent: obj,
      document: context.document,
      path: fieldPath,
      type: field.type,
    })
  })

  const results = await Promise.all([...objChecks, ...fieldChecks, ...fieldTypeChecks])
  return results.flat()
}

async function validateArray(
  items: unknown[],
  type: ArraySchemaType,
  path: Path,
  options: ValidationContext
): Promise<ValidationMarker[]> {
  if (!type) {
    return [
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationErrorClass('Unable to resolve type for array'),
      },
    ]
  }

  if (typeof type.validation === 'function') {
    throw new Error(
      `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }

  // Validate actual array itself
  const arrayChecks = (type.validation || []).map((rule) =>
    rule.validate(items, {
      parent: options.parent,
      document: options.document,
      path,
      type,
    })
  )

  // Validate items within array
  const itemChecks = items.map((item, i) => {
    const pathSegment = isKeyedObject(item) ? {_key: item._key} : i
    const itemType = resolveTypeForArrayItem(item, type.of)
    const itemPath = appendPath(path, [pathSegment])
    return validateItem(item, itemType, itemPath, {
      parent: items,
      document: options.document,
      path: itemPath,
    })
  })

  const result = await Promise.all([...arrayChecks, ...itemChecks])
  return result.flat()
}

async function validatePrimitive(
  item: unknown,
  type: SchemaType | undefined,
  path: Path,
  context: ValidationContext
): Promise<ValidationMarker[]> {
  if (!type) {
    return [
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationErrorClass('Unable to resolve type for item'),
      },
    ]
  }

  if (typeof type.validation === 'function') {
    throw new Error(
      `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
    )
  }

  const resolved = await Promise.all(
    (type.validation || []).map((rule) =>
      rule.validate(item, {
        parent: context.parent,
        document: context.document,
        path,
      })
    )
  )

  return resolved.flat()
}
