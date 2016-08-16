import path from 'path'
import fsp from 'fs-promise'
import pkg from '../../package.json'
import readLocalManifest from './readLocalManifest'

function checkLocalCli(rootDir) {
  return readLocalManifest(rootDir)
    .then(hasLocalCliDeclared)
    .then(isDeclared => hasLocalCliInstalled(rootDir, isDeclared))
}

function hasLocalCliDeclared(manifest) {
  return manifest && manifest.dependencies && manifest.dependencies[pkg.name]
}

function hasLocalCliInstalled(rootDir, isDeclared) {
  if (!isDeclared) {
    return false
  }

  const fullFath = path.resolve(path.join(rootDir, 'node_modules', pkg.name))
  return fsp.stat(fullFath).then(() => fullFath).catch(err => {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Local ${pkg.name} dependency declared, but not installed, run \`npm install\``
      )
    }

    throw err
  })
}

export default checkLocalCli
