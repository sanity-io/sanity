import {Schema} from '@sanity/types'
import {Template, TemplateBuilder} from './Template'
import {validateInitialObjectValue} from './validate'
import deepAssign from './util/deepAssign'
import {resolveInitialValueForType} from './resolveInitialValueForType'
import {resolveValue} from './util/resolveValue'
import {isRecord} from './util/isRecord'

export function isBuilder(template: Template | TemplateBuilder): template is TemplateBuilder {
  return typeof (template as TemplateBuilder).serialize === 'function'
}

export async function resolveInitialValue(
  schema: Schema,
  template: Template | TemplateBuilder,
  params: {[key: string]: any} = {}
): Promise<{[key: string]: any}> {
  // Template builder?
  if (isBuilder(template)) {
    return resolveInitialValue(schema, template.serialize(), params)
  }

  const {id, schemaType, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  let resolvedValue = await resolveValue(value, params)

  if (!isRecord(resolvedValue)) {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function returning a plain object`
    )
  }

  // validate default document initial values
  resolvedValue = validateInitialObjectValue(resolvedValue, template)

  // Get deep initial values from schema types (note: the initial value from template overrides the types)
  const newValue = deepAssign(
    (await resolveInitialValueForType(schema.get(schemaType), params)) || {},
    resolvedValue as Record<string, unknown>
  )

  // revalidate and return new initial values
  // todo: would be better to do validation as part of type resolution
  return validateInitialObjectValue(newValue, template)
}
