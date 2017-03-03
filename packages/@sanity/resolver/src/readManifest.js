/* eslint-disable no-sync, no-process-env */
import fsp from 'mz/fs'
import path from 'path'
import generateHelpUrl from '@sanity/generate-help-url'
import {reduceConfig} from '@sanity/util'
import validateManifest from './validateManifest'

function readManifestSync(manifestPath, options) {
  try {
    return parseManifest(fsp.readFileSync(manifestPath), options)
  } catch (err) {
    return handleManifestReadError(err, options)
  }
}

function handleManifestReadError(err, options) {
  if (err.code === 'ENOENT' && options.plugin) {
    const base = `No "sanity.json" file found in plugin "${options.plugin}"`
    const help = `See ${generateHelpUrl('missing-plugin-sanity-json')}`
    throw new Error(`${base}\n${help}`)
  } else if (err.name === 'ValidationError' && options.plugin) {
    err.message = `Error while reading "${options.plugin}" manifest:\n${err.message}`
  } else if (err.name === 'ValidationError') {
    err.message = `Error while reading "${options.basePath}/sanity.json":\n${err.message}`
  }

  throw err
}

function parseManifest(rawData, options) {
  const parsedManifest = JSON.parse(rawData)
  const manifest = validateManifest(parsedManifest)
  const reduced = reduceConfig(manifest, options.env)
  return reduced
}

function readManifest(opts = {}) {
  const env = process.env.NODE_ENV || 'development'
  const options = Object.assign({env}, opts)
  const basePath = options.basePath || process.cwd()
  const manifestPath = path.join(options.manifestDir || basePath, 'sanity.json')

  if (options.sync) {
    return readManifestSync(manifestPath, options)
  }

  return fsp.readFile(manifestPath, {encoding: 'utf8'})
    .then(raw => parseManifest(raw, options))
    .catch(err => handleManifestReadError(err, options))
}

export default readManifest
