const miss = require('mississippi')

module.exports = () =>
  miss.through.obj((doc, enc, callback) => callback(null, `${JSON.stringify(doc)}\n`))
