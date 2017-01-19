import fsp from 'fs-promise'
import path from 'path'
import without from 'lodash/without'
import readLocalManifest from '@sanity/util/lib/readLocalManifest'
import generateConfigChecksum from '../../util/generateConfigChecksum'
import {hasSameChecksum, localConfigExists} from '../../util/pluginChecksumManifest'

export default {
  name: 'uninstall',
  signature: '[plugin]',
  description: 'Removes a Sanity plugin from the current Sanity configuration',
  action: (args, context) => {
    const {output} = context
    const [plugin] = args.argsWithoutOptions
    if (!plugin) {
      return output.error(new Error('Plugin name must be specified'))
    }

    // @todo add support for multiple simultaneous plugins to be uninstalled
    return uninstallPlugin(plugin, context)
  }
}

async function uninstallPlugin(plugin, context) {
  const {prompt, yarn, workDir} = context
  const isFullName = plugin.indexOf('sanity-plugin-') === 0
  const shortName = isFullName ? plugin.substr(14) : plugin
  const fullName = isFullName ? plugin : `sanity-plugin-${plugin}`

  await removeConfiguration(workDir, fullName, shortName, prompt)
  await removeFromSanityManifest(workDir, shortName)
  return yarn(['remove', fullName], context)
}

async function removeConfiguration(workDir, fullName, shortName, prompt) {
  const localConfigPath = path.join(workDir, 'config', `${shortName}.json`)
  const hasLocalConfig = await localConfigExists(workDir, shortName)

  if (!hasLocalConfig) {
    return
  }

  try {
    const localChecksum = await generateConfigChecksum(localConfigPath)
    const sameChecksum = await hasSameChecksum(workDir, fullName, localChecksum)
    const {deleteConfig} = await promptOnAlteredConfiguration(shortName, sameChecksum, prompt)
    deleteConfiguration(localConfigPath, deleteConfig)
  } catch (err) {
    // Destination file does not exist?
    // Predictable, proceed with uninstall
  }
}

async function removeFromSanityManifest(workDir, pluginName) {
  const manifest = await readLocalManifest(workDir, 'sanity.json')
  manifest.plugins = without(manifest.plugins || [], pluginName)
  return fsp.writeJson(path.join(workDir, 'sanity.json'), manifest, {spaces: 2})
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
