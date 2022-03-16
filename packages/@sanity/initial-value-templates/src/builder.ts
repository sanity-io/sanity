import {Schema, SchemaType} from '@sanity/types'
import {Template, TemplateBuilder} from './Template'

function defaultTemplateForType(
  schemaType: SchemaType
): TemplateBuilder<unknown, {_type: string; [key: string]: unknown}> {
  return new TemplateBuilder({
    id: schemaType.name,
    schemaType: schemaType.name,
    title: schemaType.title || schemaType.name,
    icon: schemaType.icon,
    value: schemaType.initialValue || {_type: schemaType.name},
  })
}

function defaults(
  schema: Schema
): TemplateBuilder<unknown, {_type: string; [key: string]: unknown}>[] {
  const schemaTypes = schema
    .getTypeNames()
    .filter((typeName) => !/^sanity\./.test(typeName))
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter((typeName) => isDocumentSchemaType(typeName))

  return schemaTypes.map((schemaType) => defaultTemplateForType(schemaType))
}

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

function isDocumentSchemaType(schemaType: SchemaType) {
  return schemaType.type && schemaType.type.name === 'document'
}

export const builder = {
  template: <Params = unknown, Value = unknown>(
    spec?: Template<Params, Value>
  ): TemplateBuilder<Params, Value> => new TemplateBuilder(spec),
  defaults,
  defaultTemplateForType,
}
