const simpleGet = require('simple-get')
const HttpAgent = require('agentkeepalive')
const debug = require('./debug')

const HttpsAgent = HttpAgent.HttpsAgent
const httpAgent = new HttpAgent()
const httpsAgent = new HttpsAgent()
const socketsWithTimeout = new WeakSet()

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const MAX_RETRIES = 5

// Just a promisified simpleGet
function getStream(options) {
  return new Promise((resolve, reject) => {
    let rejected = false
    const openTimeout = setTimeout(() => {
      rejected = true
      reject(new Error(`Connection timed out after ${CONNECTION_TIMEOUT} ms`))
    }, CONNECTION_TIMEOUT)

    simpleGet(options, (err, res) => {
      clearTimeout(openTimeout)
      if (rejected) {
        return
      }

      if (err) {
        reject(err)
        return
      }

      resolve(res)
    })
  })
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* eslint-disable no-await-in-loop, max-depth */
module.exports = async (options) => {
  const agent = options.url.startsWith('https:') ? httpsAgent : httpAgent
  const reqOptions = {...options, followRedirects: false, agent}
  let error
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await getStream(reqOptions)

      if (
        response.connection &&
        typeof response.connection.setTimeout === 'function' &&
        !socketsWithTimeout.has(response.connection)
      ) {
        socketsWithTimeout.add(response.connection)
        response.connection.setTimeout(READ_TIMEOUT, () => {
          response.destroy(
            new Error(`Read timeout: No data received on socket for ${READ_TIMEOUT} ms`)
          )
        })
      }

      return response
    } catch (err) {
      error = err

      if (err.statusCode && err.statusCode < 500) {
        break
      }

      debug('Error, retrying after 1500ms: %s', err.message)
      await delay(1500)
    }
  }

  throw error
}
