import {deprecatedScheduledPublishingPlugin} from '../deprecatedPlugins/DeprecatedScheduledPublishing'
import {type PluginOptions} from './types'

const DEPRECATED_PLUGINS = [
  // Scheduled publishing is added by default, we are filtering to avoid duplicates
  'scheduled-publishing',
]

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

  const deprecatedScheduledPublishing = allPlugins.find(
    (p) => p.config.name === 'scheduled-publishing',
  )
  if (deprecatedScheduledPublishing) {
    // Add the deprecated plugin error to the plugins list, to show the error to users.
    allPlugins.push({
      path: deprecatedScheduledPublishing.path,
      config: deprecatedScheduledPublishingPlugin(),
    })
  }

  const resolved = [
    ...allPlugins.filter((plugin) => !DEPRECATED_PLUGINS.includes(plugin.config.name)),
    rootConfig,
  ]

  return resolved
}
