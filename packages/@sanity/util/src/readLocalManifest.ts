import * as path from 'path'
import fse from 'fs-extra'

export async function readLocalManifest(dirName: string, fileName = 'package.json') {
  try {
    return fse.readJson(path.join(dirName, fileName))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {}
    }

    throw new Error(`Error while attempting to read projects "${fileName}":\n${err.message}`)
  }
}
