const miss = require('mississippi')
const debug = require('./debug')

const isSystemDocument = doc => doc && doc._id && doc._id.indexOf('_.') === 0

module.exports = () =>
  miss.through.obj((doc, enc, callback) => {
    if (isSystemDocument(doc)) {
      debug('%s is a system document, skipping', doc && doc._id)
      return callback()
    }

    return callback(null, doc)
  })
