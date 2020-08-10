export function isPTSchemaType(schemaType: any) {
  return (
    schemaType.name === 'array' &&
    schemaType.of &&
    schemaType.of.length === 1 &&
    schemaType.of.filter(t => t.name === 'block').length
  )
}
