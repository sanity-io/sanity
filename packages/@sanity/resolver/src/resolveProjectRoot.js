/* eslint-disable no-sync */
import path from 'path'
import readManifest from './readManifest'

export default function resolveProjectRoot(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  return options.sync
    ? resolveProjectRootSync(options)
    : resolveProjectRootAsync(options)
}

function resolveProjectRootAsync(options) {
  // @todo implement actual async version
  return Promise.resolve(resolveProjectRootSync(options))
}

function resolveProjectRootSync(options) {
  let manifestDir = options.basePath
  let isProjectRoot = isRoot(manifestDir, options)

  while (!isProjectRoot && path.dirname(manifestDir) !== manifestDir) {
    manifestDir = path.dirname(manifestDir)
    isProjectRoot = isRoot(manifestDir, options)
  }

  return isProjectRoot ? manifestDir : false
}

function isRoot(manifestDir, options) {
  try {
    const manifest = readManifest(Object.assign({}, options, {
      manifestDir,
      sync: true,
    }))

    return manifest.root || false
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    // On any error that is not "file not found", rethrow
    throw err
  }
}
