import {fromString} from '@sanity/util/paths'

import {type DivergenceEffect} from './readDocumentDivergences'

interface SelectEffectFromHashContext {
  /**
   * The hash of the value being transitioned from.
   */
  fromHash: unknown

  /**
   * The hash of the value being transitioned to.
   */
  toHash: unknown

  /**
   * Whether the upstrean node's parent is an array. This is used to infer whether the node is an
   * array member.
   */
  upstreamParentIsArray: boolean

  /**
   * The path to the node, as a string.
   */
  path: string
}

const UNDEFINED_SHA1 = 'da39a3ee5e6b4b0d3255bfef95601890afd80709'

/**
 * Infer the effect type that occurs when transitioning the value `fromValue` to the value `toValue`,
 * using the hash of the node's value.
 *
 * @internal
 */
export function selectEffectFromHash({
  fromHash,
  toHash,
  upstreamParentIsArray,
  path,
}: SelectEffectFromHashContext): Exclude<DivergenceEffect, 'move'> {
  if (fromString(path).at(-1) === '_type' && fromHash !== toHash) {
    return 'changeObjectType'
  }

  if (fromHash !== UNDEFINED_SHA1 && toHash === UNDEFINED_SHA1) {
    return 'unset'
  }

  if (upstreamParentIsArray && fromHash === UNDEFINED_SHA1 && toHash !== UNDEFINED_SHA1) {
    return 'insert'
  }

  return 'set'
}
