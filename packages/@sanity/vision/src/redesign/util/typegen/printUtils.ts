import {type ObjectAttribute, type ObjectTypeNode, type TypeNode} from 'groq-js'

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

/** An object whose `_key`, declared by it or by a rest it is spread from, is optional */
function withOptionalKey(object: ObjectTypeNode): ObjectTypeNode {
  const key = object.attributes._key
  if (key) return {...object, attributes: {...object.attributes, _key: {...key, optional: true}}}
  return object.rest?.type === 'object' ? {...object, rest: withOptionalKey(object.rest)} : object
}

/**
 * An array's members as a JSON value holds them: a document gives every member a `_key`, which
 * a value sent as a param or kept outside a document need not have
 */
export function withOptionalKeys(member: TypeNode): TypeNode {
  if (member.type === 'union') return {...member, of: member.of.map(withOptionalKeys)}
  return member.type === 'object' ? withOptionalKey(member) : member
}
