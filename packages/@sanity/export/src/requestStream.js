const simpleGet = require('simple-get')

const MAX_RETRIES = 5

// Just a promisified simpleGet
function getStream(options) {
  return new Promise((resolve, reject) => {
    simpleGet(options, (err, res) => (err ? reject(err) : resolve(res)))
  })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/* eslint-disable no-await-in-loop, max-depth */
module.exports = async options => {
  let error
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await getStream(options)
    } catch (err) {
      error = err

      if (err.statusCode && err.statusCode < 500) {
        break
      }

      await delay(1500)
    }
  }

  throw error
}
