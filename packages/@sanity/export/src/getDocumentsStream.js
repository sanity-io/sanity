const pkg = require('../package.json')
const requestStream = require('./requestStream')

module.exports = (client, dataset) => {
  // Sanity client doesn't handle streams natively since we want to support node/browser
  // with same API. We're just using it here to get hold of URLs and tokens.
  const url = client.getUrl(`/data/export/${dataset}`)
  const headers = {
    Authorization: `Bearer ${client.config().token}`,
    'User-Agent': `${pkg.name}@${pkg.version}`
  }

  return requestStream({url, headers})
}
