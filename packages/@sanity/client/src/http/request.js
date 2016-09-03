/* eslint-disable no-empty-function, no-process-env */
const request = require('@sanity/request') // `request` in node, `xhr` in browsers
const queryString = require('./queryString')

const debug = (process.env.DEBUG || '').indexOf('sanity') !== -1

let log = () => {}
if (process.env.NODE_ENV !== 'production') {
  log = require('debug')('sanity:client')
}

module.exports = function httpRequest(options, callback) {
  if (options.query) {
    options.uri += `?${queryString.stringify(options.query)}`
  }

  if (debug) {
    log('HTTP %s %s', options.method || 'GET', options.uri)
    if (options.method === 'POST' && options.json) {
      log('Request body: %s', JSON.stringify(options.json, null, 2))
    }
  }

  const Promised = options.promise
  return new Promised((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        return reject(err)
      }

      log('Response code: %s', res.statusCode)
      if (debug && body) {
        log('Response body: %s', stringifyBody(body, res))
      }

      const isHttpError = res.statusCode >= 400

      if (isHttpError && body) {
        const msg = (body.errors ? body.errors.map(error => error.message) : [])
          .concat([body.error, body.message]).filter(Boolean).join('\n')

        const error = new Error(msg || httpError(res))
        error.responseBody = stringifyBody(body, res)
        return reject(error)
      } else if (isHttpError) {
        return reject(new Error(httpError(res)))
      }

      return resolve(body)
    })
  })
}

function httpError(res) {
  return `Server responded with HTTP ${res.statusCode} ${res.statusMessage || ''}, no description`
}

function stringifyBody(body, res) {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1
  return isJson ? JSON.stringify(body, null, 2) : body
}
