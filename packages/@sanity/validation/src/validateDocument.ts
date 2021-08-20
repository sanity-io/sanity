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

const applyPathPrefix = (results: ValidationMarker[], pathPrefix: Path): ValidationMarker[] =>
  results.map((result) => ({
    ...result,
    path: appendPath(pathPrefix, result.path),
  }))

const resolveTypeForArrayItem = (
  item: unknown,
  candidates: SchemaType[]
): SchemaType | undefined => {
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
  if (!type) {
    return Promise.resolve([
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationErrorClass('Unable to resolve type for item', {paths: [path]}),
      },
    ])
  }

  if (Array.isArray(item) && type.jsonType === 'array') {
    return validateArray(item, type, path, context)
  }

  if (typeof item === 'object' && item !== null && type.jsonType === 'object') {
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

  // Validate actual object itself
  let objChecks: Promise<ValidationMarker[]>[] = []
  if (Array.isArray(type.validation)) {
    objChecks = type.validation.map(async (rule) => {
      const ruleResults = await rule.validate(obj, {
        parent: context.parent,
        document: context.document,
        path,
        type,
      })

      return applyPathPrefix(ruleResults, path)
    })
  }

  // Validate fields within object
  const fieldRules = (type.validation || [])
    .map((rule) => rule._fieldRules)
    .filter(Boolean)
    .reduce<FieldRules>(Object.assign, {})

  const fieldChecks = type.fields.map(async (field) => {
    // field validation from the enclosing object type

    const fieldValidation = fieldRules[field.name]
    if (!fieldValidation) {
      return []
    }
    const fieldPath = appendPath(path, field.name)
    const fieldValue = obj[field.name]

    const result = await fieldValidation(new RuleClass()).validate(fieldValue, {
      parent: obj,
      document: context.document,
      path: fieldPath,
      type: field.type,
    })
    return applyPathPrefix(result, fieldPath)
  })

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
        item: new ValidationErrorClass('Unable to resolve type for array', {paths: [path]}),
      },
    ]
  }
  // Validate actual array itself
  let arrayChecks: Promise<ValidationMarker[]>[] = []

  if (Array.isArray(type.validation)) {
    arrayChecks = type.validation.map(async (rule) => {
      const ruleResults = await rule.validate(items, {
        parent: options.parent,
        document: options.document,
        path,
        type,
      })

      return applyPathPrefix(ruleResults, path)
    })
  }
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
  type: SchemaType,
  path: Path,
  context: ValidationContext
): Promise<ValidationMarker[]> {
  if (!type) {
    return [
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationErrorClass('Unable to resolve type for item', {paths: [path]}),
      },
    ]
  }

  if (!Array.isArray(type.validation)) {
    return []
  }

  const resolved = await Promise.all(
    type.validation.map(async (rule) => {
      const currRuleResults = await rule.validate(item, {
        parent: context.parent,
        document: context.document,
        path,
      })
      return applyPathPrefix(currRuleResults, path)
    })
  )
  return resolved.flat()
}
