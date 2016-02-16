import fs from 'fs'
import path from 'path'

function readLocalManifest(cwd) {
  return readManifestIfExists(path.join(cwd, 'package.json'), {encoding: 'utf8'}).then(parseManifest)
}

function parseManifest(content) {
  try {
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Error while attempting to read projects "package.json":\n${err.message}`)
  }
}

function readManifestIfExists(manifestPath, opts) {
  return new Promise((resolve, reject) => {
    fs.readFile(manifestPath, opts, (err, manifest) => {
      if (manifest) {
        return resolve(manifest)
      } else if (err && err.code === 'ENOENT') {
        return resolve('{}')
      }

      reject(err)
    })
  })
}

export default readLocalManifest
