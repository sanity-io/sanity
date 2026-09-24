import {type SchemaType, type TypeNode} from 'groq-js'

/** `blockContent` becomes `BlockContent`, `my-type` becomes `MyType`, `2fast` becomes `_2fast` */
export function toTypeName(name: string): string {
  const pascal = name
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
  if (!pascal) {
    return 'Unknown'
  }
  return /^[0-9]/.test(pascal) ? `_${pascal}` : pascal
}

/**
 * One identifier per schema type name. Different names can normalise to the same identifier
 * (`foo-bar` and `foo.bar` both want `FooBar`), so later ones get a numeric suffix; `reserved`
 * identifiers (the result type's own name) are never handed out.
 */
export function createTypeNames(
  names: readonly string[],
  reserved: readonly string[] = [],
): Map<string, string> {
  const taken = new Set(reserved)
  const identifiers = new Map<string, string>()
  for (const name of names) {
    const base = toTypeName(name)
    let candidate = base
    for (let suffix = 2; taken.has(candidate); suffix++) {
      candidate = `${base}${suffix}`
    }
    taken.add(candidate)
    identifiers.set(name, candidate)
  }
  return identifiers
}

/** The type node a schema entry stands for, documents being objects of their attributes */
export function resolveSchemaType(
  schema: SchemaType | undefined,
  name: string,
): TypeNode | undefined {
  const entry = schema?.find((candidate) => candidate.name === name)
  if (!entry) {
    return undefined
  }
  if (entry.type === 'document') {
    return {type: 'object', attributes: entry.attributes}
  }
  return entry.value
}

/**
 * Names of the schema types referenced (transitively) by `node`, in dependency order: a type is
 * listed after every type it references, except within cycles. Every type that takes part in a
 * cycle is reported in `cyclic`, since any of them may be emitted before a type it references.
 */
export function collectReferencedTypes(
  node: TypeNode,
  schema: SchemaType | undefined,
): {order: string[]; cyclic: Set<string>} {
  const order: string[] = []
  const visiting: string[] = []
  const done = new Set<string>()
  const cyclic = new Set<string>()

  const visitNode = (current: TypeNode): void => {
    switch (current.type) {
      case 'inline':
        visitName(current.name)
        return
      case 'array':
        visitNode(current.of)
        return
      case 'union':
        current.of.forEach(visitNode)
        return
      case 'object':
        Object.values(current.attributes).forEach((attribute) => visitNode(attribute.value))
        if (current.rest) visitNode(current.rest)
        return
      default:
    }
  }

  const visitName = (name: string): void => {
    if (done.has(name)) return
    const cycleStart = visiting.indexOf(name)
    if (cycleStart !== -1) {
      // A back-edge: everything from the revisited type up to the current one forms the cycle
      visiting.slice(cycleStart).forEach((member) => cyclic.add(member))
      return
    }
    visiting.push(name)
    const resolved = resolveSchemaType(schema, name)
    if (resolved) {
      visitNode(resolved)
    }
    visiting.pop()
    done.add(name)
    order.push(name)
  }

  visitNode(node)
  return {order, cyclic}
}
