import fsp from 'fs-promise'
import path from 'path'
import yarnWithProgress from '../../actions/yarn/yarnWithProgress'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import addPluginToManifest from '../../util/addPluginToManifest'
import {setChecksum, hasSameChecksum} from '../../util/pluginChecksumManifest'

export default {
  name: 'install',
  command: 'install [plugin]',
  describe: 'Installs a Sanity plugin to the current Sanity configuration',
  handler: args => {
    const plugin = args.options.plugin || ''
    if (!plugin.length) {
      return args.error(new Error('Plugin name must be specified'))
    }

    // @todo add support for multiple simultaneous plugins to be installed
    return installPlugin(plugin, args)
  }
}

function installPlugin(plugin, {output, options}) {
  const isNamespaced = plugin[0] === '@'
  let shortName = plugin
  let fullName = plugin

  if (!isNamespaced) {
    const isFullName = plugin.indexOf('sanity-plugin-') === 0
    shortName = isFullName ? plugin.substr(14) : plugin
    fullName = isFullName ? plugin : `sanity-plugin-${plugin}`
  }

  return yarnWithProgress(['add', fullName], options)
    .then(() => addPluginToManifest(options.rootDir, shortName))
    .then(() => copyConfiguration(options.rootDir, fullName, shortName, output))
    .then(() => output.print(`Plugin '${fullName}' installed`))
    .catch(err => handleNpmError(err, output.error, fullName))
}

function handleNpmError(err, printError, pluginName) {
  if (err.message.includes(`'${pluginName}' is not in the npm registry`)) {
    printError(new Error(`'${pluginName}' is not in the npm registry`))
    return
  }

  printError(err)
}

function copyConfiguration(rootDir, fullName, shortName, output) {
  const configPath = path.join(rootDir, 'node_modules', fullName, 'config.dist.json')
  const dstPath = path.join(rootDir, 'config', `${shortName}.json`)

  return fsp.stat(configPath).then(() => {
    // Configuration exists, check if user has local configuration already
    return fsp.stat(dstPath)
      .then(() => generateConfigChecksum(configPath))
      .then(distChecksum => hasSameChecksum(rootDir, fullName, distChecksum))
      .then(sameChecksum => warnOnDifferentChecksum(shortName, sameChecksum, output.print))
      .catch(() => {
        // Destination file does not exist, copy
        return fsp.copy(configPath, dstPath)
          .then(() => generateConfigChecksum(configPath))
          .then(checksum => setChecksum(rootDir, fullName, checksum))
      })
  })
}

// @todo Improve with some sort of helpful key differ or similar
function warnOnDifferentChecksum(plugin, sameChecksum, printer) {
  if (!sameChecksum) {
    printer([
      `[Warning] Default configuration for plugin '${plugin}' has changed since you first installed it,`,
      'check local configuration vs distributed configuration to ensure your configuration is up to date'
    ].join(' '))
  }
}
