import {type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {printTypeScriptNode} from './printTypeScript'
import {flattenObject, indent, printLiteralKey, uniqueMembers} from './printUtils'
import {collectReferencedTypes, createTypeNames, resolveSchemaType, toTypeName} from './schemaTypes'

export interface PrintZodOptions {
  /** Name of the query result type; the schema constant gets a `Schema` suffix */
  typeName: string
  schema?: SchemaType
}

interface PrintContext {
  /** Identifier of each referenced schema type, unique across the output */
  typeNames: Map<string, string>
  /** Referenced schema types that close a cycle and therefore need `z.lazy` */
  cyclic: Set<string>
  /** Whether schema type declarations are being printed; the result schema comes after them all */
  inDeclarations: boolean
}

function typeAliasName(typeName: string, context: PrintContext): string {
  return context.typeNames.get(typeName) ?? toTypeName(typeName)
}

function schemaName(typeName: string, context: PrintContext): string {
  return `${typeAliasName(typeName, context)}Schema`
}

function printObject(node: ObjectTypeNode, depth: number, context: PrintContext): string {
  const {attributes, rest} = flattenObject(node)
  const inner = indent(depth + 1)

  const lines = Object.entries(attributes).map(([key, attribute]) => {
    const value = printZodNode(attribute.value, depth + 1, context)
    return `${inner}${printLiteralKey(key)}: ${attribute.optional ? `${value}.optional()` : value},`
  })

  let output =
    lines.length === 0 ? 'z.object({})' : `z.object({\n${lines.join('\n')}\n${indent(depth)}})`
  if (rest?.type === 'unknown') {
    output += '.passthrough()'
  } else if (rest?.type === 'inline') {
    output += `.and(${printReference(rest.name, context)})`
  }
  return output
}

function printReference(name: string, context: PrintContext): string {
  const reference = schemaName(name, context)
  return context.inDeclarations && context.cyclic.has(name)
    ? `z.lazy(() => ${reference})`
    : reference
}

function printZodNode(node: TypeNode, depth: number, context: PrintContext): string {
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
      const members = uniqueMembers(
        node.of
          .filter((member) => member.type !== 'null')
          .map((member) => printZodNode(member, depth, context)),
      )
      if (members.length === 0) {
        return 'z.null()'
      }
      const union =
        members.length === 1
          ? members[0]
          : `z.union([\n${members.map((member) => `${indent(depth + 1)}${member},`).join('\n')}\n${indent(depth)}])`
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
  const context: PrintContext = {
    typeNames: createTypeNames(order, [options.typeName]),
    cyclic,
    inDeclarations: true,
  }
  const declarations = [`import {z} from 'zod'`]

  // TypeScript cannot infer a type through `z.lazy`, so recursive schemas are annotated with an
  // explicit type: the referenced schema types are declared as TypeScript types first (all of
  // them, since a recursive type may mention the others), and `z.infer` keeps working downstream
  if (cyclic.size > 0) {
    for (const name of order) {
      const resolved = resolveSchemaType(options.schema, name)
      const type = resolved ? printTypeScriptNode(resolved, context.typeNames) : 'unknown'
      declarations.push(`export type ${typeAliasName(name, context)} = ${type};`)
    }
  }

  for (const name of order) {
    const resolved = resolveSchemaType(options.schema, name)
    const value = resolved ? printZodNode(resolved, 0, context) : 'z.unknown()'
    const typeAnnotation = cyclic.has(name) ? `: z.ZodType<${typeAliasName(name, context)}>` : ''
    declarations.push(`export const ${schemaName(name, context)}${typeAnnotation} = ${value}`)
  }

  const resultSchema = `${options.typeName}Schema`
  declarations.push(
    `export const ${resultSchema} = ${printZodNode(node, 0, {...context, inDeclarations: false})}`,
    `export type ${options.typeName} = z.infer<typeof ${resultSchema}>`,
  )

  return declarations.join('\n\n')
}
