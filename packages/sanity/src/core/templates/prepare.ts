import {type Schema, type SchemaType} from '@sanity/types'

import {isBuilder} from './resolve'
import {type Template} from './types'
import {validateTemplates} from './validate'

function maybeSerialize(template: Template) {
  return isBuilder(template) ? template.serialize() : template
}

function isNonNullable<T>(t: T): t is NonNullable<T> {
  return !!t
}

/** @internal */
export function prepareTemplates(schema: Schema, initialValueTemplates: Template[]): Template[] {
  const serialized = initialValueTemplates.map(maybeSerialize)
  return validateTemplates(schema, serialized)
}

/** @internal */
export function defaultTemplateForType(schemaType: SchemaType): Template {
  return {
    id: schemaType.name,
    schemaType: schemaType.name,
    title: schemaType.title || schemaType.name,
    icon: schemaType.icon,
    value: schemaType.initialValue || {_type: schemaType.name},
  }
}

/** @internal */
export function defaultTemplatesForSchema(schema: Schema): Template[] {
  const schemaTypes = schema
    .getTypeNames()
    .filter((typeName) => !typeName.startsWith('sanity.'))
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter((schemaType) => schemaType.type?.name === 'document')

  return prepareTemplates(
    schema,
    schemaTypes.map((schemaType) => defaultTemplateForType(schemaType)),
  )
}
