const assign = require('xtend/mutable')

// Headers which browsers block you from setting
const disallowedHeaders = [
  'user-agent',
  'content-length'
]

const normalizeResponse = xhr => {
  const response = {
    headers: {},
    statusCode: xhr.status
  }

  const headerPairs = xhr.getAllResponseHeaders().split('\u000d\u000a')
  for (let i = 0; i < headerPairs.length; i++) {
    const headerPair = headerPairs[i]
    const index = headerPair.indexOf('\u003a\u0020')

    if (index > 0) {
      const key = headerPair.substring(0, index)
      const val = headerPair.substring(index + 2)
      response.headers[key.toLowerCase()] = val
    }
  }

  return response
}

function request(options, callback) {
  const opts = assign({}, options)
  opts.method = opts.method.toUpperCase()
  opts.uri = opts.uri.toString()

  const xhr = new XMLHttpRequest()

  // Request finished handler
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4 || xhr.status === 0) {
      return
    }

    let error
    let body = xhr.responseText
    if (opts.json && xhr.response) {
      body = xhr.response
    } else if (opts.json) {
      try {
        body = JSON.parse(xhr.responseText)
      } catch (err) {
        error = err
      }
    }

    callback(error, normalizeResponse(xhr), body)
  }

  xhr.onerror = () => {
    callback(new Error('XHR error - CORS denied?'), normalizeResponse(xhr))
  }

  if (opts.onProgress) {
    xhr.upload.addEventListener('progress', opts.onProgress, false)
  }

  xhr.open(opts.method, opts.uri, true)

  if (opts.json) {
    xhr.responseType = 'json'
  }

  for (const key in opts.headers) {
    // We're not allowed to set certain headers in browsers
    if (disallowedHeaders.indexOf(key.toLowerCase()) > -1) {
      continue
    }

    xhr.setRequestHeader(key, opts.headers[key])
  }

  // Is this a JSON-request?
  if (opts.json) {
    xhr.setRequestHeader('Accept', 'application/json')

    // Do we have a payload to deliver as JSON?
    if (typeof opts.json !== 'boolean') {
      xhr.setRequestHeader('Content-Type', 'application/json')
      opts.body = JSON.stringify(opts.json)
    }
  }

  xhr.send(opts.body)
}

module.exports = request
