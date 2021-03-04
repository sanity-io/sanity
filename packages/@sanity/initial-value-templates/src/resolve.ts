import {has, isEmpty, isFunction, isPlainObject, set, get, unset, isObject, isNil} from 'lodash'
import {StringSchemaType, ObjectSchemaType} from '@sanity/types'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'
import {getDefaultSchema} from './parts/Schema'

const schema = getDefaultSchema()

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

const isValidKey = (key) => {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype'
}

const mergeDeep = (target, ...rest) => {
  for (const obj of rest) {
    if (isObject(obj)) {
      for (const key in obj) {
        if (isValidKey(key)) {
          merge(target, obj[key], key, target)
        }
      }
    }
  }
  return target
}

function merge(target, val, key, src) {
  const obj = target[key]
  if (isObject(val) && isObject(obj)) {
    mergeDeep(obj, val)
  } else if (has(src, key) && isNil(obj)) {
    target[key] = undefined
  } else if (!isNil(obj) && !isNil(val)) {
    target[key] = obj
  } else {
    target[key] = val
  }
}

/**
 * Get deep initial values
 *
 * @param documentName {string} this is the name of the document
 * @param value {Record<string, any>} this is the our current initial value
 * @param params {[key: string]: unknown} params is a sanity context object passed to every initial value function
 * @param parentKey {string} parentKey holds nested object keys with dot notation
 * @param nestDepth {number} optional depth for building recursive functions
 */
export async function getObjectFieldsInitialValues(
  documentName: string,
  value: Record<string, any>,
  params: {[key: string]: unknown} = {},
  parentKey?: string,
  nestDepth?: number
): Promise<Record<string, any>> {
  const schemaType = schema.get(documentName)
  if (!schemaType) return {}

  // select only object types
  const fields = ((schemaType.jsonType === 'object' && schemaType.fields) || []).filter(
    (f) => f.type.jsonType === 'object'
  )

  // select all none array and object primitive types
  const primitiveFieldsWithInitial = (
    (schemaType.jsonType === 'object' && schemaType.fields) ||
    []
  ).filter(
    (f) =>
      f.type.jsonType !== 'object' && f.type.jsonType !== 'array' && has(f.type, 'initialValue')
  )

  // select all none array and object primitive types
  const arrayFieldsWithInitial = (
    (schemaType.jsonType === 'object' && schemaType.fields) ||
    []
  ).filter((f: any) => f.type.jsonType === 'array' && f.type.initialValue)

  let initialValues = value
  let primitiveInitialValues = {}

  // Get initial value of primitive types
  // If an initialValue was set, we just want to break the loop
  for (const field of primitiveFieldsWithInitial) {
    // String schema just fixes lint error for ide as field could be boolean or num as well
    const fieldType = field.type as StringSchemaType
    primitiveInitialValues[field.name] = isFunction(fieldType.initialValue)
      ? await fieldType.initialValue(params)
      : fieldType.initialValue
  }

  // Get initial value of array types (Simple implementation)
  for (const field of arrayFieldsWithInitial) {
    // String schema just fixes lint error for ide as field could be boolean or num as well
    const fieldType = field.type as StringSchemaType
    primitiveInitialValues[field.name] = isFunction(fieldType.initialValue)
      ? await fieldType.initialValue(params)
      : fieldType.initialValue
  }

  for (const field of fields) {
    // make new parent key
    const childWithPK = parentKey ? `${parentKey}.${field.name}` : field.name

    // if we have the new parent key set to undefined,
    // we just want to skip the current iteration
    if (has(value, childWithPK) && !value[childWithPK]) {
      continue
    }

    let newFieldValue = {}
    const fieldType = field.type as ObjectSchemaType

    // get initial value for the current field
    if (has(fieldType, 'initialValue')) {
      newFieldValue = isFunction(fieldType.initialValue)
        ? await fieldType.initialValue(params)
        : fieldType.initialValue
    }

    const fieldValue = {
      ...newFieldValue,
      _type: field.type.name,
    }

    // we want to update our initial value with it
    if (newFieldValue) {
      let valuesToUpdate = {
        [field.name]: fieldValue,
      }

      // Set the new value to the actual position in the tree
      if (parentKey) {
        valuesToUpdate = set({}, parentKey, valuesToUpdate)
      }

      // assign new values
      initialValues = mergeDeep(value, valuesToUpdate)
    }

    // we want to recurse if the field schema is not the same as it's parent
    // this is also to avoid recursing recursive object schema types
    // for just plain schema types, we just want to loop [7] times to fill in the rendered desk-tool form
    if (fieldType.fields && fieldType.fields.length > 0 && field.type.name !== documentName) {
      await getObjectFieldsInitialValues(field.type.name, initialValues, params, childWithPK)
    } else {
      if (nestDepth === undefined) {
        nestDepth = 1
      } else {
        nestDepth++
      }

      // [7] is a magic number which fits with initial [2] recursion before
      // this loop is entered, which equals [9] which fits in properly to default
      // rendered desk-tool form
      if (nestDepth <= 7) {
        await getObjectFieldsInitialValues(
          field.type.name,
          initialValues,
          params,
          childWithPK,
          nestDepth
        )
      }
    }
  }

  // We set our initial values with our primitive values
  if (!isEmpty(primitiveInitialValues)) {
    if (parentKey) {
      primitiveInitialValues = set({}, parentKey, primitiveInitialValues)
    }

    initialValues = mergeDeep(value, primitiveInitialValues)
  }

  // finally we want to remove any object with just one or zero keys
  const currentObject = parentKey ? get(initialValues, parentKey) : undefined
  if (
    parentKey &&
    currentObject &&
    isPlainObject(currentObject) &&
    Object.keys(currentObject).length < 2
  ) {
    unset(initialValues, parentKey)
  }

  return initialValues
}

export async function resolveInitialValue(
  template: Template | TemplateBuilder,
  params: {[key: string]: any} = {}
): Promise<{[key: string]: any}> {
  // Template builder?
  if (isBuilder(template)) {
    return resolveInitialValue(template.serialize(), params)
  }

  const {id, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  let initialValue
  if (isPlainObject(value)) {
    initialValue = value
  } else if (typeof value === 'function') {
    initialValue = await value(params)
  } else {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function`
    )
  }

  // validate default document initial values
  initialValue = validateInitialValue(initialValue, template)

  // Get dep initial values from sanity object types
  const newValue = await getObjectFieldsInitialValues(id, initialValue, params)

  // revalidate and return new initial values
  return validateInitialValue(newValue, template)
}
