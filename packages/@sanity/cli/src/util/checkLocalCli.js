import fs from 'fs'
import path from 'path'
import thenify from 'thenify'
import pkg from '../../package.json'

const stat = thenify(fs.stat)

function checkLocalCli(cwd) {
  return readManifestIfExists(path.join(cwd, 'package.json'), {encoding: 'utf8'})
    .then(parseManifest)
    .then(hasLocalCliDeclared)
    .then(isDeclared => hasLocalCliInstalled(cwd, isDeclared))
}

function hasLocalCliDeclared(manifest) {
  return manifest && manifest.dependencies && manifest.dependencies[pkg.name]
}

function hasLocalCliInstalled(cwd, isDeclared) {
  if (!isDeclared) {
    return false
  }

  const fullFath = path.resolve(path.join(cwd, 'node_modules', pkg.name))
  return stat(fullFath).then(() => fullFath).catch(err => {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Local ${pkg.name} dependency declared, but not installed, run \`npm install\``
      )
    }

    throw err
  })
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

export default checkLocalCli
