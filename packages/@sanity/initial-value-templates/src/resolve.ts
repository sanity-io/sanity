import {isPlainObject, assign, defaultsDeep, set, has} from 'lodash'
import schema from 'part:@sanity/base/schema'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

export async function getObjectFieldsInitialValues(
  documentName: string,
  value: any,
  params: {[key: string]: any} = {},
  parentKey?: string
): Promise<Record<string, any>> {
  const schemaType = schema.get(documentName)
  if (!schemaType) return {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const fields = (schemaType.fields || []).filter((f) => f.type.jsonType === 'object')

  let initialValues = value

  for (const field of fields) {
    // make new parent key
    const pk = parentKey ? `${parentKey}.${field.name}` : field.name

    // if we have the new parent key set to undefined, we just want to skip the
    // current iteration
    if (has(value, pk) && !value[pk]) {
      continue
    }

    // get initial value for the current field
    let newValue = {}
    if (field.type.initialValue) {
      newValue = isPlainObject(field.type.initialValue)
        ? field.type.initialValue
        : await field.type.initialValue(params)
    }
    newValue = {
      [field.name]: {
        _type: field.type.name,
        ...newValue,
      },
    }

    // Set the new value to the actual position in the tree
    if (parentKey) {
      newValue = set({}, parentKey, newValue)
    }
    initialValues = defaultsDeep(value, newValue)

    if (field.type.fields && field.type.fields.length > 0) {
      await getObjectFieldsInitialValues(field.type.name, initialValues, params, pk)
    }
  }

  // Static value?
  if (isPlainObject(value)) {
    return assign(initialValues, value)
  }

  // Not an object, so should be a function
  if (typeof value !== 'function') {
    throw new Error(
      `Template "${documentName}" has invalid "value" property - must be a plain object or a resolver function`
    )
  }

  return assign(initialValues, await value(params))
}

async function resolveInitialValue(
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

export {resolveInitialValue}
