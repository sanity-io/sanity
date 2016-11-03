import fsp from 'fs-promise'
import path from 'path'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import addPluginToManifest from '@sanity/util/lib/addPluginToManifest'
import {setChecksum, hasSameChecksum} from '../../util/pluginChecksumManifest'

export default {
  name: 'install',
  signature: '[PLUGIN]',
  description: 'Installs a Sanity plugin to the current Sanity configuration',
  action: async (args, context) => {
    const {extOptions} = args
    const {yarn} = context
    const [plugin] = args.argsWithoutOptions
    if (!plugin) {
      const flags = extOptions.offline ? ['--offline'] : []
      return await yarn(['install'].concat(flags), context)
    }

    // @todo add support for multiple simultaneous plugins to be installed
    return await installPlugin(plugin, context)
  }
}

async function installPlugin(plugin, context) {
  const {output, workDir, yarn} = context
  const isNamespaced = plugin[0] === '@'
  let shortName = plugin
  let fullName = plugin

  if (!isNamespaced) {
    const isFullName = plugin.indexOf('sanity-plugin-') === 0
    shortName = isFullName ? plugin.substr(14) : plugin
    fullName = isFullName ? plugin : `sanity-plugin-${plugin}`
  }

  await yarn(['add', fullName], context)
  await addPluginToManifest(workDir, shortName)
  await copyConfiguration(workDir, fullName, shortName, output)

  output.print(`Plugin '${fullName}' installed`)
}

async function copyConfiguration(rootDir, fullName, shortName, output) {
  const configPath = path.join(rootDir, 'node_modules', fullName, 'config.dist.json')
  const dstPath = path.join(rootDir, 'config', `${shortName}.json`)

  if (!fsp.existsSync(configPath)) {
    return
  }

  // Configuration exists, check if user has local configuration already
  if (fsp.existsSync(dstPath)) {
    const distChecksum = await generateConfigChecksum(configPath)
    const sameChecksum = await hasSameChecksum(rootDir, fullName, distChecksum)
    warnOnDifferentChecksum(shortName, sameChecksum, output.print)
  } else {
    // Destination file does not exist, copy
    await fsp.copy(configPath, dstPath)
    const checksum = await generateConfigChecksum(configPath)
    await setChecksum(rootDir, fullName, checksum)
  }
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
