const miss = require('mississippi')

module.exports = () =>
  miss.through.obj((doc, enc, callback) => {
    if (doc.error && doc.statusCode) {
      callback(new Error([doc.statusCode, doc.error].join(': ')))
      return
    }

    if (!doc._id && doc.error) {
      callback(new Error(doc.error.description || doc.error.message || JSON.stringify(doc)))
      return
    }

    callback(null, doc)
  })
