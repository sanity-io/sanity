const miss = require('mississippi')

module.exports = () =>
  miss.through.obj((doc, enc, callback) => {
    if (doc.error && doc.statusCode) {
      callback(new Error([doc.statusCode, doc.error].join(': ')))
      return
    }

    callback(null, doc)
  })
