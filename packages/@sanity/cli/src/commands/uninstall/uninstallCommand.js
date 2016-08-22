import fsp from 'fs-promise'
import path from 'path'
import without from 'lodash/without'
import {uninstall as npmUninstall} from '../../npm-bridge/install'
import readLocalManifest from '../../util/readLocalManifest'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import {hasSameChecksum} from '../../util/pluginChecksumManifest'

export default {
  name: 'uninstall',
  command: 'uninstall [plugin]',
  describe: 'Removes a Sanity plugin from the current Sanity configuration',
  handler: args => {
    const plugins = args.options._.slice(1)
    if (!plugins.length) {
      return args.error(new Error('Plugin name must be specified'))
    }

    return Promise.all(plugins.map(plugin => uninstallPlugin(plugin, args)))
  }
}

function uninstallPlugin(plugin, {print, error, prompt, options}) {
  const isFullName = plugin.indexOf('sanity-plugin-') === 0
  const shortName = isFullName ? plugin.substr(14) : plugin
  const fullName = isFullName ? plugin : `sanity-plugin-${plugin}`

  return removeConfiguration(options.rootDir, fullName, shortName, prompt)
    .then(() => removeFromSanityManifest(options.rootDir, shortName))
    .then(() => npmUninstall(['--save', fullName], options))
}
function removeFromSanityManifest(rootDir, pluginName) {
  return readLocalManifest(rootDir, 'sanity.json')
    .then(manifest => {
      manifest.plugins = without(manifest.plugins || [], pluginName)
      return manifest
    })
    .then(manifest => fsp.writeJson(path.join(rootDir, 'sanity.json'), manifest, {spaces: 2}))
}

function removeConfiguration(rootDir, fullName, shortName, prompt) {
  const localConfigPath = path.join(rootDir, 'config', `${shortName}.json`)

  return fsp.stat(localConfigPath).then(() => {
    // Configuration exists, check if user has local configuration already
    return fsp.stat(localConfigPath)
      .then(() => generateConfigChecksum(localConfigPath))
      .then(localChecksum => hasSameChecksum(rootDir, fullName, localChecksum))
      .then(sameChecksum => promptOnAlteredConfiguration(shortName, sameChecksum, prompt))
      .then(({deleteConfig}) => deleteConfiguration(localConfigPath, deleteConfig))
      .catch(() => Promise.resolve()) // Destination file does not exist predictable, proceed with uninstall
  })
}

function deleteConfiguration(configPath, userConfirmed) {
  if (!userConfirmed) {
    return Promise.resolve() // Leave the configuration in place
  }

  return fsp.unlink(configPath)
}

function promptOnAlteredConfiguration(plugin, sameChecksum, prompt) {
  if (sameChecksum) {
    return Promise.resolve({deleteConfig: true})
  }

  return prompt([{
    type: 'confirm',
    name: 'deleteConfig',
    message: `Local configuration for '${plugin}' has modifications - remove anyway?`,
    default: true
  }])
}
