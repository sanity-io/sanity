import {SchemaType} from '@sanity/types'
import {useSource} from '../source'

export function useSchemaType(typeName: string): SchemaType {
  const source = useSource()
  const schemaType = source.schema.get(typeName)

  if (!schemaType) {
    throw new Error(`SchemaType: not found "${typeName}"`)
  }

  return schemaType
}
