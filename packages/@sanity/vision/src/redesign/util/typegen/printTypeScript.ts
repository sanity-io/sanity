import {type ArrayTypeNode, type ObjectTypeNode, type SchemaType, type TypeNode} from 'groq-js'

import {flattenObject, indent, MAX_LINE_WIDTH, printTypeKey} from './printUtils'
import {collectReferencedTypes, createSchemaIdentifiers, resolveSchemaType} from './schemaTypes'

/** Declares the symbol `sanity typegen` keys a reference's target type on */
export const REFERENCE_SYMBOL_DECLARATION =
  'export declare const internalGroqTypeReferenceTo: unique symbol;'

/** Declares the helper `sanity typegen` prints arrays of named types with */
export const ARRAY_OF_DECLARATION = 'type ArrayOf<T> = Array<T & { _key: string }>;'

/**
 * Prints groq-js type nodes as TypeScript types the way `@sanity/codegen`'s `SchemaTypeGenerator`
 * does, naming schema types by the identifiers it was given
 */
export interface TypeScriptPrinter {
  /** The TypeScript type for `node`, its first line starting at `depth` levels of indentation */
  print(node: TypeNode, depth?: number): string
  /** Whether something printed so far refers to the `ArrayOf` helper */
  readonly usesArrayOf: boolean
  /** Whether something printed so far refers to `internalGroqTypeReferenceTo` */
  readonly usesReferenceSymbol: boolean
}

/** Joins the members of a union, or breaks them onto their own lines when they do not fit */
export function joinUnion(members: string[], depth: number): string {
  const inline = members.join(' | ')
  if (members.some((member) => member.includes('\n'))) {
    return inline
  }
  if (indent(depth + 1).length + inline.length <= MAX_LINE_WIDTH) {
    return inline
  }
  return members.map((member) => `\n${indent(depth + 1)}| ${member}`).join('')
}

/** `Array<T>`, letting a union broken onto its own lines close the angle bracket on a new one */
function wrapArray(helper: string, inner: string, depth: number): string {
  return inner.startsWith('\n') ? `${helper}<${inner}\n${indent(depth)}>` : `${helper}<${inner}>`
}

/** `key: type`, with the space dropped when the type starts on the next line */
export function joinKeyAndValue(key: string, value: string): string {
  return value.startsWith('\n') ? `${key}:${value}` : `${key}: ${value}`
}

export function createTypeScriptPrinter(
  identifiers: ReadonlyMap<string, string>,
): TypeScriptPrinter {
  let usesArrayOf = false
  let usesReferenceSymbol = false

  function printInline(name: string): string {
    const identifier = identifiers.get(name)
    return (
      identifier ??
      `unknown /* Unable to locate the referenced type ${JSON.stringify(name)} in schema */`
    )
  }

  function printArray(node: ArrayTypeNode, depth: number): string {
    // An array of named types gets `_key` through `ArrayOf`, since the members of an array in a
    // document carry one that the named type itself does not declare
    const arrayOf = (): string => {
      usesArrayOf = true
      return wrapArray('ArrayOf', print(node.of, depth), depth)
    }
    if (node.of.type === 'inline') return arrayOf()
    if (node.of.type !== 'union') return wrapArray('Array', print(node.of, depth), depth)
    const members = node.of.of
    if (members.every((member) => member.type !== 'inline')) {
      return wrapArray('Array', print(node.of, depth), depth)
    }
    if (members.every((member) => member.type === 'inline')) return arrayOf()
    // Named and anonymous members mixed: split them, so only the named ones get `_key` added
    const union = node.of
    const split = (predicate: (member: TypeNode) => boolean): ArrayTypeNode => ({
      ...node,
      of: {...union, of: members.filter(predicate)},
    })
    return joinUnion(
      [
        printArray(
          split((member) => member.type !== 'inline'),
          depth,
        ),
        printArray(
          split((member) => member.type === 'inline'),
          depth,
        ),
      ],
      depth,
    )
  }

  function printObject(node: ObjectTypeNode, depth: number): string {
    const {attributes, rest} = flattenObject(node)
    if (rest?.type === 'unknown') {
      return 'unknown'
    }
    const inner = indent(depth + 1)
    const members = Object.entries(attributes).map(
      ([key, attribute]) =>
        `${inner}${joinKeyAndValue(`${printTypeKey(key)}${attribute.optional ? '?' : ''}`, print(attribute.value, depth + 1))};`,
    )
    if (rest?.type === 'inline') {
      const identifier = identifiers.get(rest.name)
      if (!identifier) return printInline(rest.name)
      return `${printLiteral(members, depth)} & ${identifier}`
    }
    if (node.dereferencesTo !== undefined) {
      usesReferenceSymbol = true
      members.push(
        `${inner}[internalGroqTypeReferenceTo]?: ${JSON.stringify(node.dereferencesTo)};`,
      )
    }
    return printLiteral(members, depth)
  }

  function isIntersection(node: TypeNode): boolean {
    if (node.type !== 'object') return false
    const {rest} = flattenObject(node)
    return rest?.type === 'inline' && identifiers.has(rest.name)
  }

  function printLiteral(members: string[], depth: number): string {
    return members.length === 0 ? '{}' : `{\n${members.join('\n')}\n${indent(depth)}}`
  }

  function print(node: TypeNode, depth = 0): string {
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
        return printInline(node.name)
      case 'array':
        return printArray(node, depth)
      case 'union':
        // Extracted schemas have empty unions (a Portable Text list item without styles)
        if (node.of.length === 0) return 'never'
        if (node.of.length === 1) return print(node.of[0], depth)
        return joinUnion(
          node.of.map((member) => {
            const printed = print(member, depth)
            // `{…} & Ref | {…}` parses right but reads wrong
            return isIntersection(member) ? `(${printed})` : printed
          }),
          depth,
        )
      case 'object':
        return printObject(node, depth)
      default:
        node satisfies never
        return 'unknown'
    }
  }

  return {
    print,
    get usesArrayOf() {
      return usesArrayOf
    },
    get usesReferenceSymbol() {
      return usesReferenceSymbol
    },
  }
}

/** The declarations the printed types depend on, in the order `sanity typegen` writes them */
export function printHelperDeclarations(printer: TypeScriptPrinter): string[] {
  const helpers: string[] = []
  if (printer.usesReferenceSymbol) helpers.push(REFERENCE_SYMBOL_DECLARATION)
  if (printer.usesArrayOf) helpers.push(ARRAY_OF_DECLARATION)
  return helpers
}

/** The referenced schema types in schema order, which is the order `sanity typegen` declares them in */
export function sortBySchemaOrder(names: string[], schema: SchemaType | undefined): string[] {
  const position = new Map((schema ?? []).map((entry, index) => [entry.name, index]))
  return names.toSorted(
    (a, b) =>
      (position.get(a) ?? Number.MAX_SAFE_INTEGER) - (position.get(b) ?? Number.MAX_SAFE_INTEGER),
  )
}

export interface PrintTypeScriptOptions {
  /** Name of the exported type for the query result (see `toResultTypeName`) */
  typeName: string
  /** Schema the `inline` references point into; the types referenced are emitted as well */
  schema?: SchemaType
}

/**
 * Prints a query result type as TypeScript the way `sanity typegen` would: the result type
 * first, then every schema type it references (directly or through other schema types), each
 * under the alias typegen gives it, preceded by the helpers those declarations rely on.
 */
export function printTypeScript(node: TypeNode, options: PrintTypeScriptOptions): string {
  const identifiers = createSchemaIdentifiers(options.schema)
  const printer = createTypeScriptPrinter(identifiers)
  const {order} = collectReferencedTypes(node, options.schema)

  const declarations = [`export type ${options.typeName} =${printAssignment(printer.print(node))};`]
  for (const name of sortBySchemaOrder(order, options.schema)) {
    const identifier = identifiers.get(name)
    const resolved = resolveSchemaType(options.schema, name)
    // A reference the schema cannot resolve was already pointed out where it is used
    if (!identifier || !resolved) continue
    declarations.push(`export type ${identifier} =${printAssignment(printer.print(resolved))};`)
  }

  return [...printHelperDeclarations(printer), ...declarations].join('\n\n')
}

/** The right-hand side of an `=`, which a union broken onto its own lines starts on the next line */
function printAssignment(value: string): string {
  return value.startsWith('\n') ? value : ` ${value}`
}
