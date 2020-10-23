import path from 'path'
import pathExists from 'path-exists'
import fse from 'fs-extra'
import resolveTree from '@sanity/resolver'
import normalizePluginName from '../../util/normalizePluginName'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import {getChecksums, setChecksums, localConfigExists} from '../../util/pluginChecksumManifest'

async function reinitializePluginConfigs(options, flags = {}) {
  const {workDir, output, env} = options

  const localChecksums = await getChecksums(workDir)
  const allPlugins = await resolveTree({basePath: workDir, env})
  const pluginsWithDistConfig = (await Promise.all(allPlugins.map(pluginHasDistConfig))).filter(
    Boolean
  )
  const distChecksums = await Promise.all(pluginsWithDistConfig.map(getPluginConfigChecksum))
  const withLocalConfigs = await Promise.all(distChecksums.map(hasLocalConfig))
  const missingConfigs = await Promise.all(withLocalConfigs.map(createMissingConfig))
  const configPlugins = missingConfigs.map(warnOnDifferingChecksum)

  return missingConfigs.length > 0 ? saveNewChecksums(configPlugins) : Promise.resolve()

  function hasLocalConfig(plugin) {
    return localConfigExists(workDir, plugin.name).then((configDeployed) =>
      Object.assign({}, plugin, {configDeployed})
    )
  }

  function createMissingConfig(plugin) {
    if (plugin.configDeployed) {
      return plugin
    }

    const srcPath = path.join(plugin.path, 'config.dist.json')
    const dstPath = path.join(workDir, 'config', `${normalizePluginName(plugin.name)}.json`)
    const prtPath = path.relative(workDir, dstPath)

    if (!flags.quiet) {
      output.print(
        `Plugin "${plugin.name}" is missing local configuration file, creating ${prtPath}`
      )
    }

    return fse.copy(srcPath, dstPath).then(() => plugin)
  }

  function warnOnDifferingChecksum(plugin) {
    return plugin

    // Disabled for now, until we can provide a way to fix.
    // NOTE: A similar checksum diff check is also done when running the install command
    // See https://github.com/sanity-io/sanity/pull/298
    // if (flags.quiet) {
    //   return plugin
    // }
    //
    // const local = localChecksums[plugin.name]
    // if (typeof local !== 'undefined' && local !== plugin.configChecksum) {
    //   const name = normalizePluginName(plugin.name)
    //   output.print(
    //     `[WARN] Default configuration file for plugin "${name}" has changed since local copy was created`
    //   )
    // }
    //
    // return plugin
  }

  function saveNewChecksums(plugins) {
    const sums = Object.assign({}, localChecksums)
    plugins.forEach((plugin) => {
      if (!sums[plugin.name]) {
        sums[plugin.name] = plugin.configChecksum
      }
    })

    return setChecksums(workDir, sums)
  }
}

export async function tryInitializePluginConfigs(options, flags = {}) {
  try {
    await reinitializePluginConfigs(options, flags)
  } catch (err) {
    if (err.code !== 'PluginNotFound') {
      throw err
    }

    const manifest = await fse
      .readJson(path.join(options.workDir, 'package.json'))
      .catch(() => ({}))

    const dependencies = Object.keys(
      Object.assign({}, manifest.dependencies, manifest.devDependencies)
    )
    const depName = err.plugin[0] === '@' ? err.plugin : `sanity-plugin-${err.plugin}`
    if (dependencies.includes(depName)) {
      err.message = `${err.message}\n\nTry running "sanity install"?`
    } else {
      err.message = `${err.message}\n\nTry running "sanity install ${depName}"?`
    }

    throw err
  }
}

export default reinitializePluginConfigs

function getPluginConfigPath(plugin) {
  return path.join(plugin.path, 'config.dist.json')
}

function pluginHasDistConfig(plugin) {
  const configPath = getPluginConfigPath(plugin)
  return pathExists(configPath).then((exists) => exists && plugin)
}

function getPluginConfigChecksum(plugin) {
  return generateConfigChecksum(getPluginConfigPath(plugin)).then((configChecksum) =>
    Object.assign({}, plugin, {configChecksum})
  )
}
