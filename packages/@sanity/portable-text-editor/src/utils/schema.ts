import Schema from '@sanity/schema'

export function compileType(rawType: any) {
  return Schema.compile({
    name: 'blockTypeSchema',
    types: [rawType],
  }).get(rawType.name)
}
