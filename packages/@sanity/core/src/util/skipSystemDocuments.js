const through2 = require('through2')

const parseJson = json => {
  try {
    return JSON.parse(json)
  } catch (err) {
    return null
  }
}

const isSystemDocument = doc => doc && doc._id && doc._id.indexOf('_.') === 0

module.exports = through2((line, enc, callback) => {
  const doc = parseJson(line)

  if (isSystemDocument(doc)) {
    return callback()
  }

  return callback(null, `${line}\n`)
})
