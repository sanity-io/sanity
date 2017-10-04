const noop = require('lodash/noop')
const sanityClient = require('@sanity/client')
const {injectResponse} = require('get-it/middleware')

const defaultClientOptions = {
  projectId: 'foo',
  dataset: 'bar',
  token: 'abc123',
  useCdn: false
}

const getSanityClient = (inject = noop, opts = {}) => {
  const requester = sanityClient.requester.clone()
  requester.use(injectResponse({inject}))
  const req = {requester: requester}
  const client = sanityClient(Object.assign(defaultClientOptions, req, opts))
  return client
}

module.exports = {
  getSanityClient
}
