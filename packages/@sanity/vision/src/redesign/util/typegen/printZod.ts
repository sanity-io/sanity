import {type ArrayTypeNode, type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {
  createTypeScriptPrinter,
  joinKeyAndValue,
  printHelperDeclarations,
  sortBySchemaOrder,
} from './printTypeScript'
import {flattenObject, indent, MAX_LINE_WIDTH, printLiteralKey} from './printUtils'
import {collectReferencedTypes, createSchemaIdentifiers, resolveSchemaType} from './schemaTypes'

/** The Zod counterpart of typegen's `ArrayOf<T>`: an array whose members carry a `_key` */
const ARRAY_OF_ZOD_DECLARATION = [
  '/** Members of an array in a document carry a `_key` the named type does not declare */',
  'const arrayOf = <T extends z.ZodTypeAny>(member: T) =>',
  '  z.array(member.and(z.object({ _key: z.string() })))',
].join('\n')

export interface PrintZodOptions {
  /** Name of the query result type (see `toResultTypeName`); its schema gets a `Schema` suffix */
  typeName: string
  /** Schema the `inline` references point into; the types referenced are emitted as well */
  schema?: SchemaType
}

interface PrintContext {
  /** The TypeScript alias of every schema type; its Zod schema is the alias with `Schema` added */
  identifiers: ReadonlyMap<string, string>
  /** Referenced schema types that close a cycle and therefore need `z.lazy` */
  cyclic: ReadonlySet<string>
  /** Whether schema type declarations are being printed; the result schema comes after them all */
  inDeclarations: boolean
  usesArrayOf: boolean
}

function schemaName(identifier: string): string {
  return `${identifier}Schema`
}

function printReference(name: string, context: PrintContext): string {
  const identifier = context.identifiers.get(name)
  if (!identifier) {
    return `z.unknown() /* Unable to locate the referenced type ${JSON.stringify(name)} in schema */`
  }
  const reference = schemaName(identifier)
  return context.inDeclarations && context.cyclic.has(name)
    ? `z.lazy(() => ${reference})`
    : reference
}

/** `helper([a, b])` on one line when it fits, otherwise one member per line */
function printList(helper: string, members: string[], depth: number): string {
  const inline = `${helper}([${members.join(', ')}])`
  if (
    !members.some((member) => member.includes('\n')) &&
    indent(depth).length + inline.length <= MAX_LINE_WIDTH
  ) {
    return inline
  }
  const inner = indent(depth + 1)
  return `${helper}([\n${members.map((member) => `${inner}${member},`).join('\n')}\n${indent(depth)}])`
}

function printArray(node: ArrayTypeNode, depth: number, context: PrintContext): string {
  const arrayOf = (): string => {
    context.usesArrayOf = true
    return `arrayOf(${printZodNode(node.of, depth, context)})`
  }
  if (node.of.type === 'inline') return arrayOf()
  if (node.of.type !== 'union') return `z.array(${printZodNode(node.of, depth, context)})`
  const members = node.of.of
  if (members.every((member) => member.type !== 'inline')) {
    return `z.array(${printZodNode(node.of, depth, context)})`
  }
  if (members.every((member) => member.type === 'inline')) return arrayOf()
  const union = node.of
  const split = (predicate: (member: TypeNode) => boolean): ArrayTypeNode => ({
    ...node,
    of: {...union, of: members.filter(predicate)},
  })
  return printList(
    'z.union',
    [
      printArray(
        split((member) => member.type !== 'inline'),
        depth + 1,
        context,
      ),
      printArray(
        split((member) => member.type === 'inline'),
        depth + 1,
        context,
      ),
    ],
    depth,
  )
}

function printObject(node: ObjectTypeNode, depth: number, context: PrintContext): string {
  const {attributes, rest} = flattenObject(node)
  if (rest?.type === 'unknown') {
    return 'z.unknown()'
  }
  const inner = indent(depth + 1)
  const members = Object.entries(attributes).map(([key, attribute]) => {
    const value = printZodNode(attribute.value, depth + 1, context)
    return `${inner}${joinKeyAndValue(printLiteralKey(key), attribute.optional ? `${value}.optional()` : value)},`
  })
  const object =
    members.length === 0 ? 'z.object({})' : `z.object({\n${members.join('\n')}\n${indent(depth)}})`
  if (rest?.type === 'inline') {
    const identifier = context.identifiers.get(rest.name)
    if (!identifier) return printReference(rest.name, context)
    return `${object}.and(${printReference(rest.name, context)})`
  }
  return object
}

function printUnion(members: TypeNode[], depth: number, context: PrintContext): string {
  const nullable = members.some((member) => member.type === 'null')
  const defined = members.filter((member) => member.type !== 'null')
  let union: string
  if (defined.length === 0) {
    // Only null, or nothing at all (extracted schemas have empty unions)
    return nullable ? 'z.null()' : 'z.never()'
  } else if (defined.length === 1) {
    union = printZodNode(defined[0], depth, context)
  } else if (defined.every((member) => member.type === 'string' && member.value !== undefined)) {
    union = printList(
      'z.enum',
      defined.map((member) => JSON.stringify(member.type === 'string' ? member.value : undefined)),
      depth,
    )
  } else {
    union = printList(
      'z.union',
      defined.map((member) => printZodNode(member, depth + 1, context)),
      depth,
    )
  }
  return nullable ? `${union}.nullable()` : union
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
      return printArray(node, depth, context)
    case 'union':
      return printUnion(node.of, depth, context)
    case 'object':
      return printObject(node, depth, context)
    default:
      node satisfies never
      return 'z.unknown()'
  }
}

/**
 * Prints a Zod schema for a query result from the same type the TypeScript output is printed
 * from, so the two agree: optional fields are `.optional()`, `null` members `.nullable()`, and
 * the schema types the result references are declared first, dependencies before dependents,
 * with `z.lazy` breaking the cycles and `z.infer` giving the result type.
 */
export function printZod(node: TypeNode, options: PrintZodOptions): string {
  const identifiers = createSchemaIdentifiers(options.schema)
  const {order, cyclic} = collectReferencedTypes(node, options.schema)
  const context: PrintContext = {identifiers, cyclic, inDeclarations: true, usesArrayOf: false}
  const declarations: string[] = []

  // TypeScript cannot infer a type through `z.lazy`, so a recursive schema is annotated with an
  // explicit type, declared first; the other types it mentions are inferred from their schemas
  const typeIdentifiers = new Map(
    [...identifiers].map(([name, identifier]) => [
      name,
      cyclic.has(name) ? identifier : `z.infer<typeof ${schemaName(identifier)}>`,
    ]),
  )
  const typePrinter = createTypeScriptPrinter(typeIdentifiers)
  for (const name of sortBySchemaOrder([...cyclic], options.schema)) {
    const resolved = resolveSchemaType(options.schema, name)
    if (!resolved) continue
    declarations.push(`export type ${identifiers.get(name)} = ${typePrinter.print(resolved)};`)
  }

  for (const name of order) {
    const identifier = identifiers.get(name)
    const resolved = resolveSchemaType(options.schema, name)
    // A reference the schema cannot resolve was already pointed out where it is used
    if (!identifier || !resolved) continue
    const annotation = cyclic.has(name) ? `: z.ZodType<${identifier}>` : ''
    declarations.push(
      `export const ${schemaName(identifier)}${annotation} = ${printZodNode(resolved, 0, context)}`,
    )
  }

  context.inDeclarations = false
  const resultSchema = schemaName(options.typeName)
  declarations.push(
    `export const ${resultSchema} = ${printZodNode(node, 0, context)}`,
    `export type ${options.typeName} = z.infer<typeof ${resultSchema}>`,
  )

  const helpers = printHelperDeclarations(typePrinter)
  if (context.usesArrayOf) helpers.push(ARRAY_OF_ZOD_DECLARATION)

  return [`import {z} from 'zod'`, ...helpers, ...declarations].join('\n\n')
}
