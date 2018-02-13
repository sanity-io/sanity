const miss = require('mississippi')

module.exports = allowedTypes =>
  allowedTypes
    ? miss.through.obj((doc, enc, callback) => {
        const type = doc && doc._type
        if (allowedTypes.includes(type)) {
          callback(null, doc)
          return
        }

        callback()
      })
    : miss.through.obj()
