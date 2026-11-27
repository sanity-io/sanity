import {type SchemaType, type TypeNode} from 'groq-js'

import {getUniqueIdentifierForName} from './naming'

/**
 * Identifiers the printed declarations take from the global scope. A schema type named `array`
 * must not become `export type Array = …`: inside that module the alias would shadow the
 * built-in for every `Array<T>` the printers emit, and being non-generic, fail them all.
 */
const GLOBAL_IDENTIFIERS = ['Array']

/**
 * The type alias of every schema type, as `sanity typegen` names them: identifiers are handed
 * out in schema order, so of two names that normalise alike (`foo-bar` and `foo.bar` both want
 * `FooBar`) the later one gets a `_2` suffix, whichever of them a query happens to reference
 */
export function createSchemaIdentifiers(schema: SchemaType | undefined): Map<string, string> {
  const identifiers = new Map<string, string>()
  const taken = new Set<string>(GLOBAL_IDENTIFIERS)
  for (const {name} of schema ?? []) {
    if (identifiers.has(name)) continue
    const identifier = getUniqueIdentifierForName(name, taken)
    identifiers.set(name, identifier)
    taken.add(identifier)
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
