import {type Tool} from '../config/types'
import {useSource} from '../studio/source'

/**
 * React hook that returns the tools configured for the current workspace.
 * Use it from a custom component that needs to list tools or look up a {@link Tool} by name.
 *
 * @hidden
 * @beta
 */
export function useTools(): Tool[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useSource().tools
}
