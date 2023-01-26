const pkg = require('../package.json')
const requestStream = require('./requestStream')

module.exports = (client, dataset) => {
  const {token, url: baseUrl} = client.config()
  const apiUrl = baseUrl.replace(/\/+$/, '')

  // Sanity client doesn't handle streams natively since we want to support node/browser
  // with same API. We're just using it here to get hold of URLs and tokens.
  const url = `${apiUrl}/data/export/${dataset}`
  const headers = {
    'User-Agent': `${pkg.name}@${pkg.version}`,
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  }

  return requestStream({url, headers})
}
