import {isPlainObject} from 'lodash'
import {Template, TemplateBuilder} from './Template'
import {validateInitialValue} from './validate'

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
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

  // Static value?
  if (isPlainObject(value)) {
    return validateInitialValue(value, template)
  }

  // Not an object, so should be a function
  if (typeof value !== 'function') {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function`
    )
  }

  const resolved = await value(params)
  return validateInitialValue(resolved, template)
}

export {resolveInitialValue}
