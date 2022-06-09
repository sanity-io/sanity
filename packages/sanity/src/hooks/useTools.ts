import {Tool} from '../config'
import {useSource} from '../studio'

/**
 * @public
 */
export function useTools(): Tool[] {
  return useSource().tools
}
