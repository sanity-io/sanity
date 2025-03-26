import {type Workspace} from '../../config/types'
import {RELEASES_TOOL_NAME} from '../plugin'

/**
 * Determine whether the releases tool is available in the provided workspace.
 *
 * This check is performed on the available tools, rather than the enabled status of the releases
 * feature itself. This caters to scenarios in which releases are enabled for a workspace, but the
 * release tool was later removed (e.g. using a workspace tool filter).
 *
 * @internal
 */
export function releasesToolAvailable(workspace: Workspace): boolean {
  return workspace.tools.some(({name}) => name === RELEASES_TOOL_NAME)
}
