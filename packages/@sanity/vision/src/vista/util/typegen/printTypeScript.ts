import {type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {flattenObject, indent, printKey, uniqueMembers} from './printUtils'
import {collectReferencedTypes, resolveSchemaType, toTypeName} from './schemaTypes'

export interface PrintTypeScriptOptions {
  /** Name of the exported type for the query result */
  typeName: string
  /** Schema the `inline` references point into; their types are emitted as well */
  schema?: SchemaType
}

function printObject(node: ObjectTypeNode, depth: number): string {
  const {attributes, rest} = flattenObject(node)
  const inner = indent(depth + 1)

  const lines = Object.entries(attributes).map(
    ([key, attribute]) =>
      `${inner}${printKey(key)}${attribute.optional ? '?' : ''}: ${printNode(attribute.value, depth + 1)};`,
  )
  if (rest?.type === 'unknown') {
    lines.push(`${inner}[key: string]: unknown;`)
  }

  const body = lines.length === 0 ? '{}' : `{\n${lines.join('\n')}\n${indent(depth)}}`
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
      const members = uniqueMembers(node.of.map((member) => printNode(member, depth)))
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
