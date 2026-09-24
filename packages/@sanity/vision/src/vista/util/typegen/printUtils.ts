import {type ObjectAttribute, type ObjectTypeNode} from 'groq-js'

const INDENT = '  '
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export function indent(depth: number): string {
  return INDENT.repeat(depth)
}

/** Object keys as written in source: bare when they are valid identifiers, quoted otherwise */
export function printKey(key: string): string {
  // A bare `__proto__` key in an object literal sets the prototype instead of defining a property
  return IDENTIFIER.test(key) && key !== '__proto__' ? key : JSON.stringify(key)
}

export interface FlatObject {
  attributes: Record<string, ObjectAttribute>
  /** What remains once nested object rests are folded in: nothing, "anything else" or a reference */
  rest: Exclude<ObjectTypeNode['rest'], ObjectTypeNode>
}

/** Folds a chain of object rests (`{...a, ...b}`) into one attribute map */
export function flattenObject(node: ObjectTypeNode): FlatObject {
  const attributes = {...node.attributes}
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
