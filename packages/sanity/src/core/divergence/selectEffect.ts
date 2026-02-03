import {fromString} from '@sanity/util/paths'

import {type DivergenceEffect} from './readDocumentDivergences'

interface SelectEffectContext {
  /**
   * The value being transitioned from.
   */
  fromValue: unknown

  /**
   * The value being transitioned to.
   */
  toValue: unknown

  /**
   * The upstream node's parent value. This is used to infer whether the node is an array member.
   */
  upstreamParent: unknown

  /**
   * The path to the node, as a string.
   */
  path: string
}

/**
 * Infer the effect type that occurs when transitioning the value `fromValue` to the value `toValue`.
 *
 * @internal
 */
export function selectEffect({
  fromValue,
  toValue,
  upstreamParent,
  path,
}: SelectEffectContext): Exclude<DivergenceEffect, 'move'> {
  if (fromString(path).at(-1) === '_type' && fromValue !== toValue) {
    return 'changeObjectType'
  }

  if (typeof fromValue !== 'undefined' && typeof toValue === 'undefined') {
    return 'unset'
  }

  if (
    Array.isArray(upstreamParent) &&
    typeof fromValue === 'undefined' &&
    typeof toValue !== 'undefined'
  ) {
    return 'insert'
  }

  return 'set'
}
