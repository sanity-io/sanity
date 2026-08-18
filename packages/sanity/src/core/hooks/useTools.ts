import {type Tool} from '../config/types'
import {useSource} from '../studio/source'

/**
 *
 * @hidden
 * @beta
 */
export function useTools(): Tool[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useSource().tools
}
