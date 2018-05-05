const url = require('url')

module.exports = async function addCorsOrigin(givenOrigin, context) {
  const {apiClient, prompt} = context
  const origin = await (givenOrigin
    ? filterAndValidateOrigin(givenOrigin)
    : promptForOrigin(prompt))

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  return client.request({
    method: 'POST',
    url: '/cors',
    body: {origin},
    maxRedirects: 0
  })
}

function promptForOrigin(prompt) {
  return prompt.single({
    type: 'input',
    message: 'Origin (including protocol):',
    filter: filterOrigin,
    validate: validateOrigin
  })
}

function filterOrigin(origin) {
  if (origin === '*') {
    return '*'
  }

  try {
    const parsed = url.parse(origin)
    if (!/^https?:$/.test(parsed.protocol || '')) {
      return null
    }

    const host = parsed.host.replace(/:(80|443)$/, '')
    return `${parsed.protocol}//${host}`
  } catch (err) {
    return null
  }
}

function validateOrigin(origin) {
  if (origin === '*') {
    return true
  }

  try {
    url.parse(origin || 0) // Use 0 to trigger error for unset values
    return true
  } catch (err) {
    // Fall-through to error
  }

  return 'Invalid origin, must include protocol (http://some.host)'
}

function filterAndValidateOrigin(givenOrigin) {
  const origin = filterOrigin(givenOrigin)
  const result = validateOrigin(origin)
  if (result !== true) {
    throw new Error(result)
  }

  return origin
}
