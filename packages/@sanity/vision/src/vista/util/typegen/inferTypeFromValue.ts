import {type ObjectAttribute, type ObjectTypeNode, type TypeNode} from 'groq-js'

/**
 * Infers a groq-js type node from a fetched value. Used when the query cannot be evaluated
 * against the schema. Arrays of objects are merged into one object type per `_type` literal,
 * with attributes that only some items carry marked optional.
 */
export function inferTypeFromValue(value: unknown): TypeNode {
  if (value === null) {
    return {type: 'null'}
  }
  switch (typeof value) {
    case 'string':
      return {type: 'string'}
    case 'number':
      return {type: 'number'}
    case 'boolean':
      return {type: 'boolean'}
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return {type: 'array', of: {type: 'unknown'}}
        }
        return {type: 'array', of: mergeTypeNodes(value.map(inferTypeFromValue))}
      }
      return inferObject(value as Record<string, unknown>)
    default:
      return {type: 'unknown'}
  }
}

// Null-prototype maps: a projection may legitimately be keyed "__proto__"
function createAttributeMap(): Record<string, ObjectAttribute> {
  return Object.create(null) as Record<string, ObjectAttribute>
}

function inferObject(value: Record<string, unknown>): ObjectTypeNode {
  const attributes = createAttributeMap()
  for (const [key, attributeValue] of Object.entries(value)) {
    const inferred = inferTypeFromValue(attributeValue)
    attributes[key] = {
      type: 'objectAttribute',
      // `_type` discriminates unions of documents and blocks, so its literal is worth keeping
      value:
        key === '_type' && typeof attributeValue === 'string'
          ? {type: 'string', value: attributeValue}
          : inferred,
    }
  }
  return {type: 'object', attributes}
}

function objectDiscriminator(node: ObjectTypeNode): string {
  const typeAttribute = node.attributes._type?.value
  return typeAttribute?.type === 'string' && typeAttribute.value !== undefined
    ? `_type:${typeAttribute.value}`
    : ''
}

/** Combines the types of sibling values (array items, or the same attribute across items) */
export function mergeTypeNodes(nodes: TypeNode[]): TypeNode {
  const flattened = nodes.flatMap((node) => (node.type === 'union' ? node.of : [node]))
  const members: TypeNode[] = []
  const objects = new Map<string, ObjectTypeNode[]>()
  const arrays: TypeNode[] = []
  const seenPrimitives = new Set<string>()

  for (const node of flattened) {
    if (node.type === 'object') {
      const key = objectDiscriminator(node)
      objects.set(key, [...(objects.get(key) || []), node])
      continue
    }
    if (node.type === 'array') {
      arrays.push(node.of)
      continue
    }
    const key = node.type === 'inline' ? `inline:${node.name}` : node.type
    if (!seenPrimitives.has(key)) {
      seenPrimitives.add(key)
      members.push(node)
    }
  }

  for (const group of objects.values()) {
    members.push(mergeObjectNodes(group))
  }
  if (arrays.length > 0) {
    const itemTypes = arrays.filter((node) => node.type !== 'unknown')
    members.push({
      type: 'array',
      of: itemTypes.length > 0 ? mergeTypeNodes(itemTypes) : {type: 'unknown'},
    })
  }

  if (members.length === 0) {
    return {type: 'unknown'}
  }
  if (members.length === 1) {
    return members[0]
  }
  // `null` reads best at the end of a union
  members.sort((a, b) => Number(a.type === 'null') - Number(b.type === 'null'))
  return {type: 'union', of: members}
}

function mergeObjectNodes(nodes: ObjectTypeNode[]): ObjectTypeNode {
  if (nodes.length === 1) {
    return nodes[0]
  }
  const attributes = createAttributeMap()
  const keys = new Set(nodes.flatMap((node) => Object.keys(node.attributes)))
  for (const key of keys) {
    const present = nodes.filter((node) => key in node.attributes)
    const value = mergeTypeNodes(present.map((node) => node.attributes[key].value))
    const optional =
      present.length < nodes.length || present.some((node) => node.attributes[key].optional)
    attributes[key] = optional
      ? {type: 'objectAttribute', value, optional: true}
      : {type: 'objectAttribute', value}
  }
  return {type: 'object', attributes}
}
