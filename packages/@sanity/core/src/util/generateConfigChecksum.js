import crypto from 'crypto'
import fse from 'fs-extra'
import deepSortObject from 'deep-sort-object'

function generateConfigChecksum(configPath) {
  return fse.readJson(configPath).then(deepSortObject).then(generateChecksum)
}

function generateChecksum(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex')
}

export default generateConfigChecksum
