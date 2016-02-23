import fsp from 'fs-promise'
import path from 'path'

export function setChecksum(sanityPath, pluginName, checksum) {
  return getChecksums(sanityPath).then(checksums => {
    checksums[pluginName] = checksum
    return fsp.writeJson(getChecksumsPath(sanityPath), checksums, {spaces: 2})
  })
}

export function getChecksum(sanityPath, pluginName) {
  return getChecksums(sanityPath).then(sums => sums[pluginName])
}

export function getChecksums(sanityPath) {
  return fsp.readJson(getChecksumsPath(sanityPath))
    .catch(() => ({'#': 'Used by Sanity to keep track of configuration file checksums, do not delete or modify!'}))
}

export function getChecksumsPath(sanityPath) {
  return path.join(sanityPath, 'config', '.checksums')
}

export function hasSameChecksum(sanityPath, pluginName, checksum) {
  return getChecksum(sanityPath, pluginName)
    .then(sum => sum === checksum)
}
