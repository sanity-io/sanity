import crypto from 'crypto'
import fsp from 'fs-promise'
import deepSortObject from 'deep-sort-object'

function generateConfigChecksum(configPath) {
  return fsp.readJson(configPath)
    .then(deepSortObject)
    .then(generateChecksum)
}

function generateChecksum(obj) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(obj))
    .digest('hex')
}

export default generateConfigChecksum
