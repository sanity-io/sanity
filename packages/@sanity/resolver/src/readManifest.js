/* eslint-disable no-sync */
import fs from 'fs'
import fsp from 'fs-promise'
import path from 'path'
import validateManifest from './validateManifest'

function readManifestSync(manifestPath, options) {
  try {
    const manifest = fs.readFileSync(manifestPath)
    const parsedManifest = JSON.parse(manifest)
    return validateManifest(parsedManifest)
  } catch (err) {
    return handleManifestReadError(err, options)
  }
}

function handleManifestReadError(err, options) {
  if (err.code === 'ENOENT' && options.plugin) {
    throw new Error(`No "sanity.json" file found in plugin "${options.plugin}"`)
  } else if (err.name === 'ValidationError' && options.plugin) {
    err.message = `Error while reading "${options.plugin}" manifest:\n${err.message}`
  } else if (err.name === 'ValidationError') {
    err.message = `Error while reading "${options.basePath}/sanity.json":\n${err.message}`
  }

  throw err
}

function readManifest(options = {}) {
  const basePath = options.basePath || process.cwd()
  const manifestPath = path.join(options.manifestDir || basePath, 'sanity.json')

  if (options.sync) {
    return readManifestSync(manifestPath, options)
  }

  return fsp.readJson(manifestPath)
    .then(manifest => validateManifest(manifest, options.plugin))
    .catch(err => handleManifestReadError(err, options))
}

export default readManifest
