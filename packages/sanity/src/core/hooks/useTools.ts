import type {Tool} from '../config/types'
import {useSource} from '../studio/source'

/**
 *
 * @hidden
 * @beta
 */
export function useTools(): Tool[] {
  return useSource().tools
}
