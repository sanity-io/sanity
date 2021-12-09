const getIt = require('get-it')
const {promise} = require('get-it/middleware')

const pkg = require('../../package.json')

const request = getIt([promise()])

module.exports = async (url, headers = {}) => {
  const response = await request({
    url,
    stream: true,
    maxRedirects: 0,
    method: 'HEAD',
    headers: {
      'User-Agent': `${pkg.name} ${pkg.version}`,
      ...headers,
    },
  })

  if (response.statusCode >= 400) {
    const error = new Error(`Request returned HTTP ${response.statusCode}`)
    error.statusCode = response.statusCode
    throw error
  }

  response.body.resume()
  return response.headers
}
