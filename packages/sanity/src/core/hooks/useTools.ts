import {Tool} from '../config'
import {useSource} from '../studio'

/**
 * @beta
 */
export function useTools(): Tool[] {
  return useSource().tools
}
