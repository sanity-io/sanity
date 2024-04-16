import {useTools} from '../../hooks/useTools'
import {DEFAULT_PLUGIN_OPTIONS, TOOL_NAME} from '../constants'
import {type PluginOptions} from '../types'
/**
 * Retrieve current tool options, returning default options if the tool is unavailable for any reason.
 */
export function useToolOptions(): Required<PluginOptions> {
  const tools = useTools()
  const currentTool = tools.find((t) => t.name === TOOL_NAME)
  const options = currentTool?.options

  if (!options) {
    console.warn(
      '[scheduled-publishing] Unable to find tool options and reverting to default values - please ensure that the tool is available in the current studio.',
    )
    return DEFAULT_PLUGIN_OPTIONS
  }

  return options
}
