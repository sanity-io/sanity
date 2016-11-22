/* eslint-disable no-empty-function, no-process-env */
const request = require('@sanity/request') // `request` in node, `xhr` in browsers
const queryString = require('./queryString')
const Observable = require('@sanity/observable/minimal')
const assign = require('xtend/mutable')

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
    if (options.method === 'POST' && options.body) {
      log('Request body: %s', JSON.stringify(options.body, null, 2))
    }
  }

  const observable = new Observable(observer => {

    const opts = assign({}, options, {
      beforeSend(req) {
        if (options.beforeSend) {
          options.beforeSend(req)
        }

        // Todo: shim over node/browser differences
        if ('upload' in req && 'onprogress' in req.upload) {
          req.upload.onprogress = handleProgress('upload')
        }

        if ('onprogress' in req) {
          req.onprogress = handleProgress('download')
        }

        req.onabort = function () {
          observer.next({type: 'abort'})
          observer.complete()
        }
      }
    })

    const req = request(opts, (err, res, body) => {
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
        const error = extractError(body, res)
        decorateError(error, body, res)
        observer.error(error)
        return
      } else if (isHttpError) {
        const httpErr = new Error(httpError(res))
        httpErr.statusCode = res.statusCode
        observer.error(httpErr)
        return
      }

      observer.next({type: 'response', body})
      observer.complete()
    })

    return () => req.abort()

    function handleProgress(stage) {
      return event => {
        const percent = event.lengthComputable ? ((event.loaded / event.total) * 100) : -1
        observer.next({
          type: 'progress',
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

function extractError(body, res) {
  // API/Boom style errors ({statusCode, error, message})
  if (body.error && body.message) {
    return new Error(`${body.error} - ${body.message}`)
  }

  // Query/database errors ({error: {description, other, arb, props}})
  if (body.error && body.error.description) {
    const error = new Error(body.error.description)
    error.details = body.error
    return error
  }

  // Other, more arbitrary errors
  return new Error(body.error || body.message || httpError(res))
}

function decorateError(error, body, res) {
  error.responseBody = stringifyBody(body, res)
  error.statusCode = res.statusCode
}

function httpError(res) {
  const statusMessage = res.statusMessage ? ` ${res.statusMessage}` : ''
  return `Server responded with HTTP ${res.statusCode}${statusMessage}, no description`
}

function stringifyBody(body, res) {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1
  return isJson ? JSON.stringify(body, null, 2) : body
}
