const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')
const debug = require('./debug')

const request = getIt([keepAlive(), promise({onlyBody: true})])
const socketsWithTimeout = new WeakSet()

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const MAX_RETRIES = 5

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* eslint-disable no-await-in-loop, max-depth */
module.exports = async (options) => {
  let error
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await request({
        ...options,
        stream: true,
        maxRedirects: 0,
        timeout: {connect: CONNECTION_TIMEOUT, socket: READ_TIMEOUT},
      })

      if (
        response.connection &&
        typeof response.connection.setTimeout === 'function' &&
        !socketsWithTimeout.has(response.connection)
      ) {
        socketsWithTimeout.add(response.connection)
        response.connection.setTimeout(READ_TIMEOUT, () => {
          response.destroy(
            new Error(`Read timeout: No data received on socket for ${READ_TIMEOUT} ms`),
          )
        })
      }

      return response
    } catch (err) {
      error = err

      if (err.response && err.response.statusCode && err.response.statusCode < 500) {
        break
      }

      debug('Error, retrying after 1500ms: %s', err.message)
      await delay(1500)
    }
  }

  throw error
}
