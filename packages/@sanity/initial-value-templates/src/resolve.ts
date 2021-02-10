import {isPlainObject, assign} from 'lodash'
import schema from 'part:@sanity/base/schema'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

export async function getObjectFieldsInitialValues(
  documentName: string,
  value: any,
  params: {[key: string]: any} = {}
): Promise<Record<string, any>> {
  const schemaType = schema.get(documentName)
  if (!schemaType) return {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const initialValues = await (schemaType.fields || [])
    .filter((f) => f.type.jsonType === 'object' && f.type.initialValue)
    .reduce(async (obj, f) => {
      // TODO: optimize function call with some sort of batching
      const values = isPlainObject(f.type.initialValue)
        ? f.type.initialValue
        : await f.type.initialValue(params)

      return {
        ...(await obj),
        [f.name]: {
          _type: f.type.name,
          ...values,
        },
      }
    }, {})

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

  // Get initial values from sanity object type
  const newValue = await getObjectFieldsInitialValues(id, value, params)

  return validateInitialValue(newValue, template)
}

export {resolveInitialValue}
