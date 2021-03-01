const makeError = require('make-error')
const assign = require('object-assign')

function ClientError(res) {
  const props = extractErrorProps(res)
  ClientError.super.call(this, props.message)
  assign(this, props)
}

function ServerError(res) {
  const props = extractErrorProps(res)
  ServerError.super.call(this, props.message)
  assign(this, props)
}

function extractErrorProps(res) {
  const body = res.body
  const props = {
    response: res,
    statusCode: res.statusCode,
    responseBody: stringifyBody(body, res),
  }

  // API/Boom style errors ({statusCode, error, message})
  if (body.error && body.message) {
    props.message = `${body.error} - ${body.message}`
    return props
  }

  // Query/database errors ({error: {description, other, arb, props}})
  if (body.error && body.error.description) {
    props.message = body.error.description
    props.details = body.error
    return props
  }

  // Other, more arbitrary errors
  props.message = body.error || body.message || httpErrorMessage(res)
  return props
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

makeError(ClientError)
makeError(ServerError)

exports.ClientError = ClientError
exports.ServerError = ServerError
