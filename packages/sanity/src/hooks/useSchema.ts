import {Schema} from '@sanity/types'
import {useSource} from '../studio'

/**
 * @public
 */
export function useSchema(): Schema {
  return useSource().schema
}
