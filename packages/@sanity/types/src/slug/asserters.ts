import {isObject} from '../helpers'
import type {Slug} from './types'

/**
 * Checks whether the given `thing` is a slug, eg an object with a `current` string property.
 *
 * @param thing - The thing to check
 * @returns True if slug, false otherwise
 * @public
 */
export function isSlug(thing: unknown): thing is Slug {
  return isObject(thing) && typeof thing.current === 'string'
}
