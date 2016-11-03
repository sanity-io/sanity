import fsp from 'fs-promise'
import pathExists from 'path-exists'
import path from 'path'
import normalizePluginName from './normalizePluginName'

const baseChecksums = {
  '#': 'Used by Sanity to keep track of configuration file checksums, do not delete or modify!'
}

export function setChecksum(sanityPath, pluginName, checksum) {
  return getChecksums(sanityPath).then(checksums => {
    checksums[pluginName] = checksum
    return fsp.writeJson(getChecksumsPath(sanityPath), checksums, {spaces: 2})
  })
}

export function setChecksums(sanityPath, checksums) {
  const sums = Object.assign({}, baseChecksums, checksums)
  return fsp.writeJson(getChecksumsPath(sanityPath), sums, {spaces: 2})
}

export function getChecksum(sanityPath, pluginName) {
  return getChecksums(sanityPath).then(sums => sums[pluginName])
}

export function getChecksums(sanityPath) {
  return fsp.readJson(getChecksumsPath(sanityPath))
    .catch(() => baseChecksums)
}

export function getChecksumsPath(sanityPath) {
  return path.join(sanityPath, 'config', '.checksums')
}

export function hasSameChecksum(sanityPath, pluginName, checksum) {
  return getChecksum(sanityPath, pluginName)
    .then(sum => sum === checksum)
}

export function localConfigExists(sanityPath, pluginName) {
  const name = normalizePluginName(pluginName)
  return pathExists(path.join(sanityPath, 'config', `${name}.json`))
}
