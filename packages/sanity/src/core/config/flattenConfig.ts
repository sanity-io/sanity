import type {PluginOptions} from './types'

type PluginOption = {config: PluginOptions; path: string[]}

/**
 * @internal
 *
 * This function flattens the config tree into a list of configs in the order they should be applied.
 */
export const flattenConfig = (
  {plugins = [], ...currentConfig}: PluginOptions,
  path: string[]
): PluginOption[] => {
  // The APIs used at the root config level
  const rootConfig = {config: currentConfig, path: [...path, currentConfig.name]}

  const prePlugins: PluginOption[] = []
  const normalPlugins: PluginOption[] = []
  const postPlugins: PluginOption[] = []

  // An array with the APIs used in plugins
  const allPlugins = plugins.flatMap((plugin) => {
    return flattenConfig(plugin, [...path, currentConfig.name])
  })

  const resolved = [...allPlugins, rootConfig]

  // Sort the configs based on the order property
  resolved.forEach((plugin) => {
    if (plugin.config?.order === 'pre') {
      prePlugins.push(plugin)
    } else if (plugin.config?.order === 'post') {
      postPlugins.push(plugin)
    } else {
      normalPlugins.push(plugin)
    }
  })

  return [prePlugins, normalPlugins, postPlugins].flat()
}
