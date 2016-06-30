/* eslint-disable no-sync */
import path from 'path'
import readManifest from './readManifest'

export default function resolveProjectRoot(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  // @todo implement async version
  return resolveProjectRootSync(options)
}

function resolveProjectRootSync(options) {
  let manifestDir = options.basePath
  let isProjectRoot = isRoot(manifestDir)

  while (!isProjectRoot && path.dirname(manifestDir) !== manifestDir) {
    manifestDir = path.dirname(manifestDir)
    isProjectRoot = isRoot(manifestDir)
  }

  return isProjectRoot ? manifestDir : false
}

function isRoot(manifestDir) {
  try {
    const manifest = readManifest({manifestDir, sync: true})
    return manifest.root || false
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    // On any error that is not "file not found", rethrow
    throw err
  }
}
