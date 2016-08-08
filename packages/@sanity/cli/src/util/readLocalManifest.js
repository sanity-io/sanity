import fsp from 'fs-promise'
import path from 'path'

function readLocalManifest(dirName, fileName) {
  return fsp.readJson(path.join(dirName, fileName || 'package.json')).catch(err => {
    if (err.code === 'ENOENT') {
      return Promise.resolve({})
    }

    throw new Error(`Error while attempting to read projects "${fileName}":\n${err.message}`)
  })
}

export default readLocalManifest
