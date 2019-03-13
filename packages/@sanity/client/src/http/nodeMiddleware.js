const retry = require('get-it/lib-node/middleware/retry')
const debug = require('get-it/lib-node/middleware/debug')
const headers = require('get-it/lib-node/middleware/headers')
const keepAlive = require('get-it/lib-node/middleware/keepAlive')

const pkg = require('../../package.json')

const middleware = [
  debug({verbose: true, namespace: 'sanity:client'}),
  headers({'User-Agent': `${pkg.name} ${pkg.version}`}),
  retry({maxRetries: 3}),
  keepAlive({ms: 75000})
]

module.exports = middleware
