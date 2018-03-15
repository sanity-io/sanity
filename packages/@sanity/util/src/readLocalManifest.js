import fse from 'fs-extra'
import path from 'path'

async function readLocalManifest(dirName, fileName = 'package.json') {
  try {
    return fse.readJson(path.join(dirName, fileName))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {}
    }

    throw new Error(`Error while attempting to read projects "${fileName}":\n${err.message}`)
  }
}

export default readLocalManifest
