import {defaultsDeep, has, isPlainObject, set} from 'lodash'
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
  parentKey?: string,
  nestDepth?: number
): Promise<Record<string, any>> {
  const schemaType = schema.get(documentName)
  if (!schemaType) return {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const fields = (schemaType.fields || []).filter((f) => f.type.jsonType === 'object')

  let initialValues = value

  for (const field of fields) {
    // make new parent key
    const childWithPK = parentKey ? `${parentKey}.${field.name}` : field.name

    // if we have the new parent key set to undefined, we just want to skip the
    // current iteration
    if (has(value, childWithPK) && !value[childWithPK]) {
      continue
    }

    let newFieldValue = {}
    // get initial value for the current field

    if (field.type.initialValue) {
      newFieldValue = isPlainObject(field.type.initialValue)
        ? field.type.initialValue
        : await field.type.initialValue(params)
    }

    const fieldValue = {
      _type: field.type.name,
      ...newFieldValue,
    }

    newFieldValue = {
      [field.name]: fieldValue,
    }

    // Set the new value to the actual position in the tree
    if (parentKey) {
      newFieldValue = set({}, parentKey, newFieldValue)
    }

    initialValues = defaultsDeep(value, newFieldValue)

    if (field.type.fields && field.type.fields.length > 0 && field.type.name !== documentName) {
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

  return initialValues
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
  const newValue = await getObjectFieldsInitialValues(id, initialValue, params)
  console.log(newValue)
  return validateInitialValue(newValue, template)
}

export {resolveInitialValue}
