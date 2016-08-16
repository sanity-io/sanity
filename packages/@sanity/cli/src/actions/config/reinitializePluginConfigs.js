import path from 'path'
import pathExists from 'path-exists'
import fsp from 'fs-promise'
import resolveTree from '@sanity/resolver'
import normalizePluginName from '../../util/normalizePluginName'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import {getChecksums, setChecksums, localConfigExists} from '../../util/pluginChecksumManifest'

export default function reinitializePluginConfigs(options) {
  const {rootDir, print} = options
  const localChecksums = {}

  return getChecksums(rootDir)
    .then(checksums => Object.assign(localChecksums, checksums))
    .then(() => resolveTree({basePath: rootDir}))
    .then(plugins => Promise.all(plugins.map(pluginHasDistConfig)))
    .then(plugins => plugins.filter(Boolean))
    .then(plugins => Promise.all(plugins.map(getPluginConfigChecksum)))
    .then(plugins => Promise.all(plugins.map(hasLocalConfig)))
    .then(plugins => Promise.all(plugins.map(createMissingConfig)))
    .then(plugins => plugins.map(warnOnDifferingChecksum))
    .then(saveNewChecksums)

  function hasLocalConfig(plugin) {
    return localConfigExists(rootDir, plugin.name)
      .then(configDeployed => Object.assign({}, plugin, {configDeployed}))
  }

  function createMissingConfig(plugin) {
    if (plugin.configDeployed) {
      return plugin
    }

    const srcPath = path.join(plugin.path, 'config.dist.json')
    const dstPath = path.join(rootDir, 'config', `${normalizePluginName(plugin.name)}.json`)
    const prtPath = path.relative(rootDir, dstPath)

    print(`Plugin "${plugin.name}" is missing local configuration file, creating ${prtPath}`)
    return fsp.copy(srcPath, dstPath).then(() => plugin)
  }

  function warnOnDifferingChecksum(plugin) {
    const local = localChecksums[plugin.name]
    if (typeof local !== 'undefined' && local !== plugin.configChecksum) {
      const name = normalizePluginName(plugin.name)
      print(`[WARN] Default configuration file for plugin "${name}" has changed since local copy was created`)
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

    return setChecksums(rootDir, sums)
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
