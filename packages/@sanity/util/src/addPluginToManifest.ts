import * as path from 'path'
import fse from 'fs-extra'
import readLocalManifest from './readLocalManifest'

const addPluginToManifest = (sanityDir, pluginName) =>
  readLocalManifest(sanityDir, 'sanity.json')
    .then((manifest) => {
      manifest.plugins = manifest.plugins || []
      if (manifest.plugins.indexOf(pluginName) === -1) {
        manifest.plugins.push(pluginName)
      }
      return manifest
    })
    .then((manifest) => fse.writeJson(path.join(sanityDir, 'sanity.json'), manifest, {spaces: 2}))

export default addPluginToManifest
