const getUri = require('@rexxars/get-uri')
const simpleConcat = require('simple-concat')

function getBufferForUri(uri) {
  return new Promise((resolve, reject) => {
    getUri(uri, (err, stream) => {
      if (err) {
        reject(new Error(readError(uri, err)))
        return
      }

      simpleConcat(stream, (streamErr, buffer) => {
        if (streamErr) {
          reject(new Error(readError(uri, streamErr)))
          return
        }

        resolve(buffer)
      })
    })
  })
}

function readError(uri, err) {
  return `Error while fetching asset from "${uri}":\n${err.message}`
}

module.exports = getBufferForUri
