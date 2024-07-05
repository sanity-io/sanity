import {isArraySchemaType, type SchemaType} from 'sanity'

/**
 * Check if a schema type is a portable text type
 */
export function isPortableTextSchemaType(schemaType: SchemaType): boolean {
  return isArraySchemaType(schemaType) && schemaType.of.some((t) => t.name === 'block')
}
