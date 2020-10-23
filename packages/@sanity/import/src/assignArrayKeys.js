const crypto = require('crypto')
const isPlainObject = require('lodash/isPlainObject')

// Note: Mutates in-place
function assignArrayKeys(obj) {
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (isPlainObject(item) && !item._key) {
        item._key = generateKey()
      }

      assignArrayKeys(item)
    })

    return obj
  }

  if (isPlainObject(obj)) {
    Object.keys(obj).forEach((key) => {
      assignArrayKeys(obj[key])
    })

    return obj
  }

  return obj
}

function generateKey(length = 8) {
  const bytes = crypto.randomBytes(length * 2)
  const base64 = bytes.toString('base64')
  const alphaNum = base64.replace(/[^a-z0-9]/gi, '')
  return alphaNum.slice(0, length)
}

module.exports = assignArrayKeys
