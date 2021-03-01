const mockBrowserEnvironment = require('../../util/mockBrowserEnvironment')

function getSanitySchema(basePath) {
  const cleanup = mockBrowserEnvironment(basePath)

  const schemaMod = require('part:@sanity/base/schema')
  const schema = schemaMod.default || schemaMod

  cleanup()
  return schema
}

module.exports = getSanitySchema
