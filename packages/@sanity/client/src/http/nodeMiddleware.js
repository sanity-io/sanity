const debug = require('get-it/lib/middleware/debug')
const headers = require('get-it/lib/middleware/headers')
const pkg = require('../../package.json')

const middleware = [
  debug({verbose: true, namespace: 'sanity:client'}),
  headers({'User-Agent': `${pkg.name} ${pkg.version}`})
]

module.exports = middleware
