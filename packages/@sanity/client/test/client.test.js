const test = require('tape')
const nock = require('nock')
const assign = require('xtend')
const sanityClient = require('../src/client')

const apiHost = 'api.sanity.url'
const projectHost = (projectId = 'bf1942') => `https://${projectId}.${apiHost}`
const clientConfig = {apiHost: `https://${apiHost}`, projectId: 'bf1942', dataset: 'foo'}
const getClient = (conf = {}) => sanityClient(assign({}, clientConfig, conf))

test('can get and set config', t => {
  const client = sanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')
  t.equal(client.config({projectId: 'def456'}), client, 'returns client on set')
  t.equal(client.config().projectId, 'def456', 'new config is set')
  t.end()
})

test('throws if no projectId is set', t => {
  t.throws(sanityClient, /projectId/)
  t.end()
})

//test('')
