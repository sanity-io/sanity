import {defaultsDeep, has, isEmpty, isFunction, isPlainObject, set, get, unset} from 'lodash'
import schema from 'part:@sanity/base/schema'
import {StringSchemaType, ObjectSchemaType} from '@sanity/types'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

export async function getObjectFieldsInitialValues(
  documentName: string,
  value: Record<string, any>,
  params: {[key: string]: unknown} = {},
  parentKey?: string,
  nestDepth?: number
): Promise<Record<string, any>> {
  const schemaType = schema.get(documentName)
  if (!schemaType) return {}

  const fields = ((schemaType.jsonType === 'object' && schemaType.fields) || []).filter(
    (f) => f.type.jsonType === 'object'
  )

  const primitiveFieldsWithInitial = (
    (schemaType.jsonType === 'object' && schemaType.fields) ||
    []
  ).filter((f) => f.type.jsonType !== 'object' && f.type.jsonType !== 'array')

  let initialValues = value
  let primitiveInitialValues = {}

  // If an initialValue was set, we just want to break the loop
  for (const field of primitiveFieldsWithInitial) {
    // String schema just fixes lint error for ide as field could be boolean or num as well
    const fieldType = field.type as StringSchemaType
    if (fieldType.initialValue && parentKey) {
      primitiveInitialValues[field.name] = isFunction(fieldType.initialValue)
        ? await fieldType.initialValue(params)
        : fieldType.initialValue
    }
  }

  for (const field of fields) {
    // make new parent key
    const childWithPK = parentKey ? `${parentKey}.${field.name}` : field.name

    // if we have the new parent key set to undefined, we just want to skip the
    // current iteration
    if (has(value, childWithPK) && !value[childWithPK]) {
      continue
    }

    let newFieldValue = {}
    const fieldType = field.type as ObjectSchemaType

    // get initial value for the current field
    if (fieldType.initialValue) {
      newFieldValue = isFunction(fieldType.initialValue)
        ? await fieldType.initialValue(params)
        : fieldType.initialValue
    }

    const fieldValue = {
      ...newFieldValue,
      _type: field.type.name,
    }

    // if we do have some value that contains more keys the _type
    // we want to update our initial value with it
    if (newFieldValue) {
      let valuesToUpdate = {
        [field.name]: fieldValue,
      }

      // Set the new value to the actual position in the tree
      if (parentKey) {
        valuesToUpdate = set({}, parentKey, valuesToUpdate)
      }

      initialValues = defaultsDeep(value, valuesToUpdate)
    }

    if (fieldType.fields && fieldType.fields.length > 0 && field.type.name !== documentName) {
      await getObjectFieldsInitialValues(field.type.name, initialValues, params, childWithPK)
    } else {
      if (nestDepth === undefined) {
        nestDepth = 1
      } else {
        nestDepth++
      }

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
    initialValues = defaultsDeep(value, primitiveInitialValues)
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

  // Get initial values from sanity object type
  initialValue = validateInitialValue(initialValue, template)
  const newValue = await getObjectFieldsInitialValues(id, initialValue, params)
  return validateInitialValue(newValue, template)
}
