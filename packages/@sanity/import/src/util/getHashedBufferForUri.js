const crypto = require('crypto')
const {URL} = require('whatwg-url')
const miss = require('mississippi')
const getUri = require('get-uri')
const retryOnFailure = require('./retryOnFailure')

module.exports = uri => retryOnFailure(() => getHashedBufferForUri(uri))

async function getHashedBufferForUri(uri) {
  const stream = await getStream(uri)
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    const chunks = []

    stream.on('data', chunk => {
      chunks.push(chunk)
      hash.update(chunk)
    })

    miss.finished(stream, err => {
      if (err) {
        reject(err)
        return
      }

      resolve({
        buffer: Buffer.concat(chunks),
        sha1hash: hash.digest('hex')
      })
    })
  })
}

function getStream(uri) {
  const parsed = new URL(uri)
  return new Promise((resolve, reject) =>
    getUri(parsed.href, (err, stream) => {
      if (err) {
        reject(new Error(readError(uri, err)))
        return
      }

      resolve(stream)
    })
  )
}

function readError(uri, err) {
  return `Error while fetching asset from "${uri}":\n${err.message}`
}
