import path from 'path'
import fsp from 'fs-promise'
import pkg from '../../package.json'
import readLocalManifest from './readLocalManifest'

function checkLocalCli(cwd) {
  return readLocalManifest(cwd)
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
