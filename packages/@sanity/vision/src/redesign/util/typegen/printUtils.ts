import {type ObjectAttribute, type ObjectTypeNode} from 'groq-js'

import {isIdentifierName} from './naming'

const INDENT = '  '

/** Past this many columns a union is broken onto one line per member, as a formatter would */
export const MAX_LINE_WIDTH = 80

export function indent(depth: number): string {
  return INDENT.repeat(depth)
}

/** Member keys of a TypeScript type literal: bare when valid identifiers, quoted otherwise */
export function printTypeKey(key: string): string {
  return isIdentifierName(key) ? key : JSON.stringify(key)
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
