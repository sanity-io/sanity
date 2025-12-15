import {type Tool} from './types'

/**
 * System tools that should not trigger default redirect behavior
 * or count toward "has configured tools" checks.
 *
 * These are tools provided by default plugins that users typically
 * don't explicitly configure.
 *
 * @internal
 */
const SYSTEM_TOOL_TYPES = ['sanity/schedules', 'sanity/scheduled-publishing']

/**
 * Determines if a tool is a system tool that should be excluded
 * from default redirect and "no tools" warning behavior.
 *
 * @param tool - The tool to check
 * @returns True if the tool is a system tool
 * @internal
 */
export function isSystemTool(tool: Tool): boolean {
  return (
    tool.__internalApplicationType !== undefined &&
    SYSTEM_TOOL_TYPES.includes(tool.__internalApplicationType)
  )
}
