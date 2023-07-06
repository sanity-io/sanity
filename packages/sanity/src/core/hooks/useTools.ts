import {Tool} from '../config'
import {useSource} from '../studio'

/**
 *
 * @hidden
 * @beta
 */
export function useTools(): Tool[] {
  return useSource().tools
}
