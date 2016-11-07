import path from 'path'
import pathExists from 'path-exists'
import fsp from 'fs-promise'
import resolveTree from '@sanity/resolver'
import normalizePluginName from '../../util/normalizePluginName'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import {getChecksums, setChecksums, localConfigExists} from '../../util/pluginChecksumManifest'

export default async function reinitializePluginConfigs(options) {
  const {workDir, output} = options

  const localChecksums = await getChecksums(workDir)
  const allPlugins = await resolveTree({basePath: workDir})
  const pluginsWithDistConfig = (await Promise.all(allPlugins.map(pluginHasDistConfig))).filter(Boolean)
  const distChecksums = await Promise.all(pluginsWithDistConfig.map(getPluginConfigChecksum))
  const withLocalConfigs = await Promise.all(distChecksums.map(hasLocalConfig))
  const missingConfigs = await Promise.all(withLocalConfigs.map(createMissingConfig))
  const configPlugins = missingConfigs.map(warnOnDifferingChecksum)

  return await saveNewChecksums(configPlugins)

  function hasLocalConfig(plugin) {
    return localConfigExists(workDir, plugin.name)
      .then(configDeployed => Object.assign({}, plugin, {configDeployed}))
  }

  function createMissingConfig(plugin) {
    if (plugin.configDeployed) {
      return plugin
    }

    const srcPath = path.join(plugin.path, 'config.dist.json')
    const dstPath = path.join(workDir, 'config', `${normalizePluginName(plugin.name)}.json`)
    const prtPath = path.relative(workDir, dstPath)

    output.print(`Plugin "${plugin.name}" is missing local configuration file, creating ${prtPath}`)
    return fsp.copy(srcPath, dstPath).then(() => plugin)
  }

  function warnOnDifferingChecksum(plugin) {
    const local = localChecksums[plugin.name]
    if (typeof local !== 'undefined' && local !== plugin.configChecksum) {
      const name = normalizePluginName(plugin.name)
      output.print(`[WARN] Default configuration file for plugin "${name}" has changed since local copy was created`)
    }

    return plugin
  }

  function saveNewChecksums(plugins) {
    const sums = Object.assign({}, localChecksums)
    plugins.forEach(plugin => {
      if (!sums[plugin.name]) {
        sums[plugin.name] = plugin.configChecksum
      }
    })

    return setChecksums(workDir, sums)
  }
}

function getPluginConfigPath(plugin) {
  return path.join(plugin.path, 'config.dist.json')
}

function pluginHasDistConfig(plugin) {
  const configPath = getPluginConfigPath(plugin)
  return pathExists(configPath).then(exists => exists && plugin)
}

function getPluginConfigChecksum(plugin) {
  return generateConfigChecksum(getPluginConfigPath(plugin))
    .then(configChecksum => Object.assign({}, plugin, {configChecksum}))
}
