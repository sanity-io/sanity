import {type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {flattenObject, indent, printTypeKey, uniqueMembers} from './printUtils'
import {collectReferencedTypes, createTypeNames, resolveSchemaType, toTypeName} from './schemaTypes'

export interface PrintTypeScriptOptions {
  /** Name of the exported type for the query result */
  typeName: string
  /** Schema the `inline` references point into; their types are emitted as well */
  schema?: SchemaType
}

interface PrintContext {
  /** Identifier of each referenced schema type, unique across the output */
  typeNames: Map<string, string>
}

function referenceName(name: string, context: PrintContext): string {
  return context.typeNames.get(name) ?? toTypeName(name)
}

function printObject(node: ObjectTypeNode, depth: number, context: PrintContext): string {
  const {attributes, rest} = flattenObject(node)
  const inner = indent(depth + 1)

  const lines = Object.entries(attributes).map(
    ([key, attribute]) =>
      `${inner}${printTypeKey(key)}${attribute.optional ? '?' : ''}: ${printNode(attribute.value, depth + 1, context)};`,
  )
  if (rest?.type === 'unknown') {
    lines.push(`${inner}[key: string]: unknown;`)
  }

  const body = lines.length === 0 ? '{}' : `{\n${lines.join('\n')}\n${indent(depth)}}`
  return rest?.type === 'inline' ? `${body} & ${referenceName(rest.name, context)}` : body
}

function printNode(node: TypeNode, depth: number, context: PrintContext): string {
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
      return referenceName(node.name, context)
    case 'array':
      return `Array<${printNode(node.of, depth, context)}>`
    case 'union': {
      const members = uniqueMembers(node.of.map((member) => printNode(member, depth, context)))
      return members.length === 1 ? members[0] : members.join(' | ')
    }
    case 'object':
      return printObject(node, depth, context)
    default:
      return 'unknown'
  }
}

/** Prints one node as a TypeScript type, naming the schema types it references through `typeNames` */
export function printTypeScriptNode(node: TypeNode, typeNames: Map<string, string>): string {
  return printNode(node, 0, {typeNames})
}

/**
 * Prints a query result type as TypeScript, followed by the schema types it references, in the
 * style of `sanity typegen`.
 */
export function printTypeScript(node: TypeNode, options: PrintTypeScriptOptions): string {
  const {order} = collectReferencedTypes(node, options.schema)
  const context: PrintContext = {typeNames: createTypeNames(order, [options.typeName])}
  const declarations = [`export type ${options.typeName} = ${printNode(node, 0, context)};`]

  for (const name of order) {
    const resolved = resolveSchemaType(options.schema, name)
    declarations.push(
      `export type ${referenceName(name, context)} = ${resolved ? printNode(resolved, 0, context) : 'unknown'};`,
    )
  }

  return declarations.join('\n\n')
}
