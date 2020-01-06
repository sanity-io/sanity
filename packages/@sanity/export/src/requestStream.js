const simpleGet = require('simple-get')
const HttpAgent = require('agentkeepalive')
const debug = require('./debug')

const HttpsAgent = HttpAgent.HttpsAgent
const httpAgent = new HttpAgent()
const httpsAgent = new HttpsAgent()

const RESPONSE_TIMEOUT = 15000
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
  const agent = options.url.startsWith('https:') ? httpsAgent : httpAgent
  const reqOptions = {...options, followRedirects: false, agent}
  let error
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await getStream(reqOptions)
      response.setTimeout(RESPONSE_TIMEOUT)
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
