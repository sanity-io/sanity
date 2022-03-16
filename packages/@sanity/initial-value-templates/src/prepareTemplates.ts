import {Schema} from '@sanity/types'
import {isBuilder} from './resolve'
import {Template, TemplateBuilder} from './Template'
import {validateTemplates} from './validate'

export function prepareTemplates(
  schema: Schema,
  initialValueTemplates: (Template | TemplateBuilder)[]
): Template[] {
  const serialized = initialValueTemplates.map(maybeSerialize)

  return validateTemplates(schema, serialized)
}

function maybeSerialize(template: Template | TemplateBuilder) {
  return isBuilder(template) ? template.serialize() : template
}
