/* eslint-disable no-empty-function, no-process-env */
const getIt = require('get-it')
const createErrorClass = require('create-error-class')
const observable = require('get-it/lib/middleware/observable')
const retry = require('get-it/lib/middleware/retry')
const debug = require('get-it/lib/middleware/debug')
const jsonRequest = require('get-it/lib/middleware/jsonRequest')
const jsonResponse = require('get-it/lib/middleware/jsonResponse')
const sanityObservable = require('@sanity/observable/minimal')

const ClientError = createErrorClass('ClientError', extractError)
const ServerError = createErrorClass('ServerError', extractError)

const httpError = ({
  onResponse: res => {
    if (res.statusCode >= 500) {
      throw new ServerError(res)
    } else if (res.statusCode >= 400) {
      throw new ClientError(res)
    }

    return res
  }
})

function retry5xx(err) {
  // Retry low-level network errors
  if (retry.shouldRetry(err)) {
    return true
  }

  return err.response && err.response.statusCode >= 500
}

function extractError(res) {
  const body = res.body
  this.response = res
  this.statusCode = res.statusCode
  this.responseBody = stringifyBody(body, res)

  // API/Boom style errors ({statusCode, error, message})
  if (body.error && body.message) {
    this.message = `${body.error} - ${body.message}`
    return
  }

  // Query/database errors ({error: {description, other, arb, props}})
  if (body.error && body.error.description) {
    this.message = body.error.description
    this.details = body.error
    return
  }

  // Other, more arbitrary errors
  this.message = body.error || body.message || httpErrorMessage(res)
}

function httpErrorMessage(res) {
  const statusMessage = res.statusMessage ? ` ${res.statusMessage}` : ''
  return `${res.method}-request to ${res.url} resulted in HTTP ${res.statusCode}${statusMessage}`
}

function stringifyBody(body, res) {
  const contentType = (res.headers['content-type'] || '').toLowerCase()
  const isJson = contentType.indexOf('application/json') !== -1
  return isJson ? JSON.stringify(body, null, 2) : body
}

const request = getIt([
  debug({verbose: true, namespace: 'sanity:client'}),
  jsonRequest(),
  jsonResponse(),
  httpError,
  observable({implementation: sanityObservable}),
  retry({maxRetries: 5, shouldRetry: retry5xx})
])

module.exports = function httpRequest(options) {
  const obs = request(options)
  obs.toPromise = () => new Promise((resolve, reject) => {
    obs.filter(ev => ev.type === 'response').subscribe(
      res => resolve(res.body),
      reject
    )
  })
  return obs
}
