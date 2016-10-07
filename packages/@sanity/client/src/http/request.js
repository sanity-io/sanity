/* eslint-disable no-empty-function, no-process-env */
const request = require('@sanity/request') // `request` in node, `xhr` in browsers
const queryString = require('./queryString')
const Observable = require('zen-observable')

const debug = (process.env.DEBUG || '').indexOf('sanity') !== -1

let log = () => {}
if (process.env.NODE_ENV !== 'production') {
  log = require('debug')('sanity:client')
}

module.exports = function httpRequest(options) {
  if (options.query) {
    options.uri += `?${queryString.stringify(options.query)}`
  }

  if (debug) {
    log('HTTP %s %s', options.method || 'GET', options.uri)
    if (options.method === 'POST' && options.json) {
      log('Request body: %s', JSON.stringify(options.json, null, 2))
    }
  }

  const observable = new Observable(observer => {
    const req = request(options, (err, res, body) => {
      if (err) {
        observer.error(err)
        return
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
        error.statusCode = res.statusCode
        observer.error(error)
        return
      } else if (isHttpError) {
        const httpErr = new Error(httpError(res))
        httpErr.statusCode = res.statusCode
        observer.error(httpErr)
        return
      }

      observer.next({name: 'response', body})
      observer.complete()
    })

    // Todo: shim over node/browser differences
    if ('upload' in req && 'onprogress' in req.upload) {
      req.upload.onprogress = handleProgress('upload')
    }

    if ('onprogress' in req) {
      req.onprogress = handleProgress('download')
    }

    req.onabort = () => {
      observer.next({name: 'abort'})
      observer.complete()
    }

    return () => req.abort()

    function handleProgress(stage) {
      return event => {
        const percent = event.lengthComputable ? event.loaded / event.total : -1
        observer.next({
          name: 'progress',
          stage,
          percent
        })
      }
    }
  })

  observable.toPromise = () => {
    let last
    return observable
      .forEach(value => {
        last = value
      })
      .then(() => last.body)
  }
  return observable
}

function httpError(res) {
  return `Server responded with HTTP ${res.statusCode} ${res.statusMessage || ''}, no description`
}

function stringifyBody(body, res) {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1
  return isJson ? JSON.stringify(body, null, 2) : body
}
