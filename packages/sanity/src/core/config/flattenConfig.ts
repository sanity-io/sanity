import {type PluginOptions} from './types'

/**
 * @internal
 *
 * This function flattens the config tree into a list of configs in the order they should be applied.
 */
export const flattenConfig = (
  {plugins = [], ...currentConfig}: PluginOptions,
  path: string[],
): Array<{config: PluginOptions; path: string[]}> => {
  // The APIs used at the root config level
  const rootConfig = {config: currentConfig, path: [...path, currentConfig.name]}

  // An array with the APIs used in plugins
  const allPlugins = plugins.flatMap((plugin) =>
    flattenConfig(plugin, [...path, currentConfig.name]),
  )

  // We need to check if the task plugin was added, it could be inserted more than once, in that case we only want to add it once.
  const tasksPlugin = allPlugins.find((plugin) => plugin.config.name === 'sanity/tasks')

  const resolved = [
    ...allPlugins.filter((plugin) => plugin.config.name !== 'sanity/tasks'),
    rootConfig,
  ]

  if (tasksPlugin) {
    resolved.push(tasksPlugin)
  }
  return resolved
}
