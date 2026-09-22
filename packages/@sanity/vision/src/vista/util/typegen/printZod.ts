import {type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {collectReferencedTypes, resolveSchemaType, toTypeName} from './schemaTypes'

const INDENT = '  '
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export interface PrintZodOptions {
  /** Name of the query result type; the schema constant gets a `Schema` suffix */
  typeName: string
  schema?: SchemaType
}

interface PrintContext {
  /** Referenced schema types that close a cycle and therefore need `z.lazy` */
  cyclic: Set<string>
  /** Whether schema type declarations are being printed; the result schema comes after them all */
  inDeclarations: boolean
}

function schemaName(typeName: string): string {
  return `${toTypeName(typeName)}Schema`
}

function printKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key)
}

function printObject(node: ObjectTypeNode, depth: number, context: PrintContext): string {
  const inner = INDENT.repeat(depth + 1)
  const attributes = {...node.attributes}
  let rest = node.rest
  while (rest && rest.type === 'object') {
    Object.assign(attributes, rest.attributes)
    rest = rest.rest
  }

  const lines = Object.entries(attributes).map(([key, attribute]) => {
    const value = printZodNode(attribute.value, depth + 1, context)
    return `${inner}${printKey(key)}: ${attribute.optional ? `${value}.optional()` : value},`
  })

  let output =
    lines.length === 0
      ? 'z.object({})'
      : `z.object({\n${lines.join('\n')}\n${INDENT.repeat(depth)}})`
  if (rest?.type === 'unknown') {
    output += '.passthrough()'
  } else if (rest?.type === 'inline') {
    output += `.and(${printReference(rest.name, context)})`
  }
  return output
}

function printReference(name: string, context: PrintContext): string {
  const reference = schemaName(name)
  return context.inDeclarations && context.cyclic.has(name)
    ? `z.lazy(() => ${reference})`
    : reference
}

export function printZodNode(node: TypeNode, depth: number, context: PrintContext): string {
  switch (node.type) {
    case 'string':
      return node.value === undefined ? 'z.string()' : `z.literal(${JSON.stringify(node.value)})`
    case 'number':
      return node.value === undefined ? 'z.number()' : `z.literal(${String(node.value)})`
    case 'boolean':
      return node.value === undefined ? 'z.boolean()' : `z.literal(${String(node.value)})`
    case 'null':
      return 'z.null()'
    case 'unknown':
      return 'z.unknown()'
    case 'inline':
      return printReference(node.name, context)
    case 'array':
      return `z.array(${printZodNode(node.of, depth, context)})`
    case 'union': {
      const nullable = node.of.some((member) => member.type === 'null')
      const members = [
        ...new Set(
          node.of
            .filter((member) => member.type !== 'null')
            .map((member) => printZodNode(member, depth, context)),
        ),
      ]
      if (members.length === 0) {
        return 'z.null()'
      }
      const union =
        members.length === 1
          ? members[0]
          : `z.union([\n${members.map((member) => `${INDENT.repeat(depth + 1)}${member},`).join('\n')}\n${INDENT.repeat(depth)}])`
      return nullable ? `${union}.nullable()` : union
    }
    case 'object':
      return printObject(node, depth, context)
    default:
      return 'z.unknown()'
  }
}

/**
 * Prints a Zod schema for a query result, preceded by schemas for the referenced schema types
 * (dependencies first, cycles broken with `z.lazy`).
 */
export function printZod(node: TypeNode, options: PrintZodOptions): string {
  const {order, cyclic} = collectReferencedTypes(node, options.schema)
  const context: PrintContext = {cyclic, inDeclarations: true}
  const declarations = [`import {z} from 'zod'`]

  for (const name of order) {
    const resolved = resolveSchemaType(options.schema, name)
    const value = resolved ? printZodNode(resolved, 0, context) : 'z.unknown()'
    // Recursive schemas need an explicit type, since TypeScript cannot infer through `z.lazy`
    const typeAnnotation = cyclic.has(name) ? ': z.ZodTypeAny' : ''
    declarations.push(`export const ${schemaName(name)}${typeAnnotation} = ${value}`)
  }

  const resultSchema = `${options.typeName}Schema`
  declarations.push(
    `export const ${resultSchema} = ${printZodNode(node, 0, {...context, inDeclarations: false})}`,
    `export type ${options.typeName} = z.infer<typeof ${resultSchema}>`,
  )

  return declarations.join('\n\n')
}
