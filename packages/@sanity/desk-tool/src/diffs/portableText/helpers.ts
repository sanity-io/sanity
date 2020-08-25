import {SchemaType} from '@sanity/field/diff'

export function isPTSchemaType(schemaType: SchemaType) {
  return (
    schemaType.jsonType === 'array' &&
    schemaType.of &&
    schemaType.of.some(candidate => candidate.name === 'block')
  )
}
