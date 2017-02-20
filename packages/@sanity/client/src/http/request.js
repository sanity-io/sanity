/* eslint-disable no-empty-function, no-process-env */
const getIt = require('get-it')
const assign = require('object-assign')
const createErrorClass = require('create-error-class')
const observable = require('get-it/lib/middleware/observable')
const retry = require('get-it/lib/middleware/retry')
const jsonRequest = require('get-it/lib/middleware/jsonRequest')
const jsonResponse = require('get-it/lib/middleware/jsonResponse')
const SanityObservable = require('@sanity/observable/minimal')
const progress = require('get-it/lib/middleware/progress')

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

const middleware = [
  jsonRequest(),
  jsonResponse(),
  progress(),
  httpError,
  observable({implementation: SanityObservable}),
  retry({maxRetries: 5, shouldRetry: retry5xx})
]

// Don't include debug middleware in browsers
if (process.env.BROWSERIFY_ENV !== 'build') {
  const debug = require('get-it/lib/middleware/debug')
  middleware.unshift(debug({verbose: true, namespace: 'sanity:client'}))
}

const request = getIt(middleware)

function httpRequest(options, requester = request) {
  return requester(assign({maxRedirects: 0}, options))
}

httpRequest.defaultRequester = request

module.exports = httpRequest
