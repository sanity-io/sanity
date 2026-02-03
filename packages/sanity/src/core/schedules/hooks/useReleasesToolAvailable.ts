import {useMemo} from 'react'

import {useWorkspace} from '../../studio/workspace'
import {SCHEDULES_TOOL_NAME} from '../plugin'

/**
 * Determine whether the releases tool is available in the current workspace.
 *
 * This check is performed on the available tools, rather than the enabled status of the releases
 * feature itself. This caters to scenarios in which releases are enabled for the workspace, but the
 * release tool was later removed (e.g. using a workspace tool filter).
 *
 * @internal
 */
export function useReleasesToolAvailable(): boolean {
  const workspace = useWorkspace()
  return useMemo(() => workspace.tools.some(({name}) => name === SCHEDULES_TOOL_NAME), [workspace])
}
