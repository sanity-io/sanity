const {createClient, requester: defaultRequester} = require('@sanity/client')
const {injectResponse} = require('get-it/middleware')
const noop = require('lodash/noop')

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('UNHANDLED REJECTION', reason)
})

const defaultClientOptions = {
  apiVersion: '1',
  projectId: 'foo',
  dataset: 'bar',
  token: 'abc123',
  useCdn: false,
}

const getSanityClient = (inject = noop, opts = {}) => {
  const requester = defaultRequester.clone()
  requester.use(injectResponse({inject}))
  const req = {requester: requester}
  const client = createClient(Object.assign(defaultClientOptions, req, opts))
  return client
}

module.exports = {
  getSanityClient,
}
