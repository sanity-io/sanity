const miss = require('mississippi')
const debug = require('./debug')

module.exports = () => {
  let firstChunk = true
  return miss.through((chunk, enc, callback) => {
    if (firstChunk) {
      const string = chunk.toString('utf8').split('\n')[0]
      debug('First chunk received: %s', string.slice(0, 300))
      firstChunk = false
    }

    callback(null, chunk)
  })
}
