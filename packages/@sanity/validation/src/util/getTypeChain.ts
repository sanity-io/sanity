import {type SchemaType} from '@sanity/types'

export function getTypeChain(
  type: SchemaType | undefined,
  visited: Set<SchemaType> = new Set(),
): SchemaType[] {
  if (!type) return []
  if (visited.has(type)) return []

  visited.add(type)

  const next = type.type ? getTypeChain(type.type, visited) : []
  return [...next, type]
}
