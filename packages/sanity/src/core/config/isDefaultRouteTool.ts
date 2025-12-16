import {type Tool} from './types'

const NON_DEFAULT_ROUTE_TOOL_TYPES = ['sanity/schedules']

/**
 * Determines if a tool should be eligible for default routing.
 *
 * @internal
 */
export function isDefaultRouteTool(tool: Tool): boolean {
  return (
    !tool.__internalApplicationType ||
    !NON_DEFAULT_ROUTE_TOOL_TYPES.includes(tool.__internalApplicationType)
  )
}
