import Type from 'type-of-is'
import {flatten} from 'lodash'
import ValidationError from './ValidationError'
import Rule from './Rule'

/* eslint-disable no-console */
export default async (doc, schema) => {
  const documentType = schema.get(doc._type)
  if (!documentType) {
    console.warn('Schema type for object type "%s" not found, skipping validation', doc._type)
    return []
  }

  try {
    return await validateItem(doc, documentType, [], {document: doc})
  } catch (err) {
    console.error(err)
    return [{type: 'validation', level: 'error', path: [], item: new ValidationError(err.message)}]
  }
}

export function validateItem(item, type, path, options) {
  if (Array.isArray(item)) {
    return validateArray(item, type, path, options)
  }

  if (typeof item === 'object') {
    return validateObject(item, type, path, options)
  }

  return validatePrimitive(item, type, path, options)
}

function validateObject(obj, type, path, options) {
  if (!type) {
    return []
  }

  // Validate actual object itself
  let objChecks = []
  if (type.validation) {
    objChecks = type.validation.map(async (rule) => {
      const ruleResults = await rule.validate(obj, {
        parent: options.parent,
        document: options.document,
        path,
        type,
      })

      return applyPath(ruleResults, path)
    })
  }

  // Validate fields within object
  const fields = type.fields || []

  const fieldRules = type.validation
    .map((rule) => rule._fieldRules)
    .filter(Boolean)
    .reduce(Object.assign, {})

  const fieldChecks = fields.map((field) => {
    // field validation from the enclosing object type

    const fieldValidation = fieldRules[field.name]
    if (!fieldValidation) {
      return []
    }
    const fieldPath = appendPath(path, field.name)
    const fieldValue = obj[field.name]

    return fieldValidation(new Rule())
      .validate(fieldValue, {
        parent: obj,
        document: options.document,
        path: fieldPath,
        type: field.type,
      })
      .then((result) => applyPath(result, fieldPath))
  })

  const fieldTypeChecks = fields.map((field) => {
    // field validation from field type

    const fieldPath = appendPath(path, field.name)
    const fieldValue = obj[field.name]
    const validation = field.type && field.type.validation
    if (!validation) {
      return []
    }
    return validateItem(fieldValue, field.type, fieldPath, {
      parent: obj,
      document: options.document,
      path: fieldPath,
      type: field.type,
    })
  })

  return Promise.all([...objChecks, ...fieldChecks, ...fieldTypeChecks]).then(flatten)
}

function validateArray(items, type, path, options) {
  if (!type) {
    return [
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationError('Unable to resolve type for array'),
      },
    ]
  }
  // Validate actual array itself
  let arrayChecks = []
  if (type.validation) {
    arrayChecks = type.validation.map(async (rule) => {
      const ruleResults = await rule.validate(items, {
        parent: options.parent,
        document: options.document,
        path,
        type,
      })

      return applyPath(ruleResults, path)
    })
  }
  // Validate items within array
  const itemChecks = items.map((item, i) => {
    const pathSegment = item && item._key ? {_key: item._key} : i
    const itemType = resolveTypeForArrayItem(item, type.of)
    const itemPath = appendPath(path, [pathSegment])
    return validateItem(item, itemType, itemPath, {
      parent: items,
      document: options.document,
      path: itemPath,
    })
  })

  return Promise.all([...arrayChecks, ...itemChecks]).then(flatten)
}

function validatePrimitive(item, type, path, options) {
  if (!type) {
    return [
      {
        type: 'validation',
        level: 'error',
        path,
        item: new ValidationError('Unable to resolve type for item'),
      },
    ]
  }

  if (!type.validation) {
    return []
  }

  const results = type.validation.map((rule) =>
    rule
      .validate(item, {
        parent: options.parent,
        document: options.document,
        path,
        type: {name: options.type?.name, options: options.type?.options},
      })
      .then((currRuleResults) => applyPath(currRuleResults, path))
  )

  return Promise.all(results).then(flatten)
}

function resolveTypeForArrayItem(item, candidates) {
  const primitive =
    typeof item === 'undefined' || item === null || (!item._type && Type.string(item).toLowerCase())

  if (primitive && primitive !== 'object') {
    return candidates.find((candidate) => candidate.jsonType === primitive)
  }

  return (
    candidates.find((candidate) => candidate.type.name === item._type) ||
    candidates.find((candidate) => candidate.name === item._type) ||
    candidates.find((candidate) => candidate.name === 'object' && primitive === 'object')
  )
}

function appendPath(base, next) {
  return base.concat(next)
}

function applyPath(results, pathPrefix) {
  return results.map((result) => {
    const path = typeof result.path === 'undefined' ? pathPrefix : pathPrefix.concat(result.path)
    return {type: 'validation', ...result, path}
  })
}
