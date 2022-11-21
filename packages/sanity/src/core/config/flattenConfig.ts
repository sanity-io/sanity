import type {PluginOptions} from './types'

type PluginOption = {config: PluginOptions; path: string[]}

/**
 * @internal
 *
 * This function flattens the config tree into a list of configs in the order they should be applied
 */
export const flattenConfig = (
  {plugins = [], ...currentConfig}: PluginOptions,
  path: string[]
): PluginOption[] => {
  const preConfigs: PluginOption[] = []
  const normalConfigs: PluginOption[] = []
  const postConfigs: PluginOption[] = []

  // List of all plugins
  const allPlugins = plugins.flatMap((plugin) =>
    flattenConfig(plugin, [...path, currentConfig.name])
  )

  // The root config
  const rootConfig = {config: currentConfig, path: [...path, currentConfig.name]}

  // List of all plugins and the root config.
  // We want the root config to be in the last position so it can override plugin configs.
  const configList = [...allPlugins, rootConfig]

  // Sort the list of configs based on the order property
  configList.forEach((configItem) => {
    const {order} = configItem.config

    if (order === 'pre') {
      preConfigs.push(configItem)
    } else if (order === 'post') {
      postConfigs.push(configItem)
    } else {
      normalConfigs.push(configItem)
    }
  })

  return [...preConfigs, ...normalConfigs, ...postConfigs]
}
