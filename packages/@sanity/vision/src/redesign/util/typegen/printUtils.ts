import {type ObjectAttribute, type ObjectTypeNode} from 'groq-js'

const INDENT = '  '
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export function indent(depth: number): string {
  return INDENT.repeat(depth)
}

/** Member keys of a TypeScript type literal: bare when valid identifiers, quoted otherwise */
export function printTypeKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key)
}

/**
 * Property keys of a JavaScript object literal. `__proto__` (bare or quoted) would set the
 * prototype instead of defining a property, so it is written as a computed key.
 */
export function printLiteralKey(key: string): string {
  return key === '__proto__' ? `[${JSON.stringify(key)}]` : printTypeKey(key)
}

export interface FlatObject {
  attributes: Record<string, ObjectAttribute>
  /** What remains once nested object rests are folded in: nothing, "anything else" or a reference */
  rest: Exclude<ObjectTypeNode['rest'], ObjectTypeNode>
}

/** Folds a chain of object rests (`{...a, ...b}`) into one attribute map */
export function flattenObject(node: ObjectTypeNode): FlatObject {
  // Null prototype: assigning a "__proto__" attribute must define it, not set the prototype
  const attributes: Record<string, ObjectAttribute> = Object.assign(
    Object.create(null),
    node.attributes,
  )
  let rest = node.rest
  while (rest && rest.type === 'object') {
    Object.assign(attributes, rest.attributes)
    rest = rest.rest
  }
  return {attributes, rest}
}

/** The distinct printed members of a union, in order of first appearance */
export function uniqueMembers(printed: string[]): string[] {
  return [...new Set(printed)]
}
