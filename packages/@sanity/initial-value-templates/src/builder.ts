import {SchemaType} from '@sanity/types'
import {Template, TemplateBuilder} from './Template'
import {Schema, getDefaultSchema} from './parts/Schema'
import {isRecord} from './util/isRecord'

function defaultTemplateForType(
  schemaType: string | SchemaType,
  sanitySchema?: Schema
): TemplateBuilder {
  let type: SchemaType

  if (typeof schemaType === 'string') {
    const schema = sanitySchema || getDefaultSchema()
    type = schema.get(schemaType)
  } else {
    type = schemaType
  }

  let initialValue: unknown = type.initialValue || {_type: type.name}

  // This handles scenario when `{}` is passed as initial value
  if (isRecord(type.initialValue) && !Object.keys(type.initialValue).length) {
    initialValue = {_type: type.name}
  }

  return new TemplateBuilder({
    id: type.name,
    schemaType: type.name,
    title: type.title || type.name,
    icon: type.icon,
    value: initialValue,
  })
}

function defaults(sanitySchema?: Schema): TemplateBuilder[] {
  const schema = sanitySchema || getDefaultSchema()
  if (!schema) {
    throw new Error(
      'Unable to automatically resolve schema. Pass schema explicitly: `defaults(schema)`'
    )
  }

  return schema
    .getTypeNames()
    .filter((typeName) => !/^sanity\./.test(typeName))
    .filter((typeName) => isDocumentSchemaType(typeName, schema))
    .map((typeName) => defaultTemplateForType(schema.get(typeName), schema))
}

function isDocumentSchemaType(typeName: string, schema: Schema) {
  const schemaType = schema.get(typeName)
  return schemaType.type && schemaType.type.name === 'document'
}

export default {
  template: (spec?: Template) => new TemplateBuilder(spec),
  defaults,
  defaultTemplateForType,
}
