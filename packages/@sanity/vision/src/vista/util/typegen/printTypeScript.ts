import {type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {collectReferencedTypes, resolveSchemaType, toTypeName} from './schemaTypes'

const INDENT = '  '
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export interface PrintTypeScriptOptions {
  /** Name of the exported type for the query result */
  typeName: string
  /** Schema the `inline` references point into; their types are emitted as well */
  schema?: SchemaType
}

function printKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key)
}

function printObject(node: ObjectTypeNode, depth: number): string {
  const inner = INDENT.repeat(depth + 1)
  const lines: string[] = []
  let rest = node.rest
  const attributes = {...node.attributes}

  // An object rest merges into the same block
  while (rest && rest.type === 'object') {
    Object.assign(attributes, rest.attributes)
    rest = rest.rest
  }

  for (const [key, attribute] of Object.entries(attributes)) {
    lines.push(
      `${inner}${printKey(key)}${attribute.optional ? '?' : ''}: ${printNode(attribute.value, depth + 1)};`,
    )
  }
  if (rest?.type === 'unknown') {
    lines.push(`${inner}[key: string]: unknown;`)
  }

  const body = lines.length === 0 ? '{}' : `{\n${lines.join('\n')}\n${INDENT.repeat(depth)}}`
  return rest?.type === 'inline' ? `${body} & ${toTypeName(rest.name)}` : body
}

export function printNode(node: TypeNode, depth = 0): string {
  switch (node.type) {
    case 'string':
      return node.value === undefined ? 'string' : JSON.stringify(node.value)
    case 'number':
      return node.value === undefined ? 'number' : String(node.value)
    case 'boolean':
      return node.value === undefined ? 'boolean' : String(node.value)
    case 'null':
      return 'null'
    case 'unknown':
      return 'unknown'
    case 'inline':
      return toTypeName(node.name)
    case 'array':
      return `Array<${printNode(node.of, depth)}>`
    case 'union': {
      const members = [...new Set(node.of.map((member) => printNode(member, depth)))]
      return members.length === 1 ? members[0] : members.join(' | ')
    }
    case 'object':
      return printObject(node, depth)
    default:
      return 'unknown'
  }
}

/**
 * Prints a query result type as TypeScript, followed by the schema types it references, in the
 * style of `sanity typegen`.
 */
export function printTypeScript(node: TypeNode, options: PrintTypeScriptOptions): string {
  const declarations = [`export type ${options.typeName} = ${printNode(node)};`]

  const {order} = collectReferencedTypes(node, options.schema)
  for (const name of order) {
    const resolved = resolveSchemaType(options.schema, name)
    declarations.push(
      `export type ${toTypeName(name)} = ${resolved ? printNode(resolved) : 'unknown'};`,
    )
  }

  return declarations.join('\n\n')
}
