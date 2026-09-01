import {dequal} from 'dequal/lite'

import {type SearchTerms} from './types'

/**
 * Compares two sets of search terms for equality, treating schema type name as type identity.
 *
 * Compiled schema types are cyclic object graphs, so a generic deep comparison of two distinct
 * type instances can recurse without terminating. Within a workspace the name identifies the
 * type, and comparing names also avoids walking the type graph.
 *
 * @internal
 */
export function isEqualSearchTerms(a: SearchTerms, b: SearchTerms): boolean {
  if (a === b) return true
  const {types: aTypes, ...aRest} = a
  const {types: bTypes, ...bRest} = b
  return (
    aTypes.length === bTypes.length &&
    aTypes.every((type, index) => type === bTypes[index] || type.name === bTypes[index].name) &&
    dequal(aRest, bRest)
  )
}
