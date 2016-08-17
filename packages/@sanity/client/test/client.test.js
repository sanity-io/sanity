import nock from 'nock'
import test from 'ava'
import sanityClient from '../src/client'

const noop = () => {} // eslint-disable-line no-empty-function
const baseUrl = 'https://api.sanity.url'
const clientConfig = {baseUrl, dataset: 'foo', projectId: '76bc'}
const getClient = (conf = {}) => sanityClient({...clientConfig, ...conf})

test('can get and set config', t => {
  nock(baseUrl).post('/76bc/v1/data/q/foo', {query: 'query'}).reply(200, {ms: 123, result: []})
  nock(baseUrl).post('/1bc3/v1/data/q/bar', {query: 'query'}).reply(200, {ms: 456, result: []})

  const client = getClient()
  return client.fetch('query')
    .then(res => t.is(res.ms, 123))
    .then(() =>
      client
        .config({dataset: 'bar', projectId: '1bc3'})
        .fetch('query')
        .then(res => t.is(res.ms, 456)))
})

test('can do simple requests', t => {
  nock(baseUrl)
    .post('/76bc/v1/data/q/foo', {query: 'query'})
    .reply(200, {
      ms: 123,
      result: [{foo: 'bar'}, {bar: 'foo'}]
    })

  return getClient().fetch('query').then(res => {
    t.is(res.result[0].foo, 'bar')
    t.is(res.result[1].bar, 'foo')
  })
})

test('can do update mutations', t => {
  const patch = {description: 'foo'}

  nock(baseUrl)
    .post('/76bc/v1/data/m/foo?returnIds=true', {'foo:raptor': {$$update: patch}})
    .reply(200, {})

  return getClient().update('foo:raptor', patch)
})

test('can create something', t => {
  const doc = {title: 'Baloney'}

  nock(baseUrl)
    .post('/76bc/v1/data/m/foo?returnIds=true', {'foo:': {$$create: doc}})
    .reply(201, {ms: 123, transactionId: 'bar', docIds: ['foo:99']})

  return getClient().create(doc).then(res => {
    t.is(res.transactionId, 'bar')
    t.is(res.docIds[0], 'foo:99')
  })
})

test('can delete', t => {
  nock(baseUrl)
    .post('/76bc/v1/data/m/foo?returnIds=true', {foo: {$$delete: null}})
    .reply(200, {ms: 123, transactionId: 'bar'})

  return getClient().delete('foo').then(res => {
    t.is(res.transactionId, 'bar')
  })
})

test('request errors are captured as errors', t => {
  nock(baseUrl)
    .post('/76bc/v1/data/q/foo', {query: 'some invalid query'})
    .reply(400, {errors: [{message: 'Some error', line: 1, column: 13}]})

  return t.throws(
    getClient().fetch('some invalid query'),
    /Some error/
  )
})

test('throws if adding unknown event handlers', t =>
  t.throws(() => getClient().on('foo', noop), /unknown event type "foo"/i)
)

test('throws if adding event handler without a function', t =>
  t.throws(() => getClient().on('request', 'bar'), /must be a function/)
)

test.cb('event handlers can be added and triggered', t => {
  getClient().on('request', (method, params) => {
    t.is(method, 'create')
    t.deepEqual(params, {opts: true})
    t.end()
  }).emit('request', 'create', {opts: true})
})

test.cb('request event handlers are run pre-request', t => {
  nock(baseUrl)
    .post('/76bc/v1/data/q/foo', {query: '*'})
    .reply(200, {ms: 123, result: []})

  let requestHookHasBeenResolved = false
  let requestHookHasBeenRun = false

  const reqHandler = () => {
    requestHookHasBeenRun = true
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        requestHookHasBeenResolved = true
        resolve()
      }, 150)
    })
  }

  t.is(requestHookHasBeenRun, false)
  t.is(requestHookHasBeenResolved, false)
  getClient()
    .on('request', reqHandler)
    .fetch('*')
    .then(() => {
      t.is(requestHookHasBeenRun, true)
      t.is(requestHookHasBeenResolved, true)
      t.end()
    })
    .catch(err => {
      throw err
    })

  t.is(requestHookHasBeenRun, true)
  t.is(requestHookHasBeenResolved, false)
})

test('can add and remove event handlers', t => {
  nock(baseUrl).post('/76bc/v1/data/q/foo', {query: 'foo'}).reply(200, {ms: 1, result: []})
  nock(baseUrl).post('/76bc/v1/data/q/foo', {query: 'bar'}).reply(200, {ms: 1, result: []})

  let callCount = 0
  const client = getClient()
  const incCallCount = () => callCount++

  return client
    .on('request', incCallCount)
    .fetch('foo')
    .then(() => t.is(callCount, 1))
    .then(() => client.removeListener('request', incCallCount))
    .then(() => client.fetch('bar'))
    .then(() => {
      t.is(callCount, 1)
    })
})

test('does not blow up when emitting events without handlers', t => {
  t.notThrows(() => {
    getClient().emit('foo', 'bar')
  })
})

test('throws if trying to remove handler that is not registered', t => {
  t.throws(() => {
    getClient()
      .on('request', noop)
      .removeListener('request', () => { /* empty */ })
  }, /not registered for this event/)
})

test('can set and get new configuration', t => {
  nock(baseUrl)
    .post('/76bc/v1/data/m/bar?returnIds=true', {doc: {$$delete: null}})
    .reply(200, {ms: 123, transactionId: 'bar'})

  const url = 'https://api.sanity.url/76bc/v1'
  const client = getClient()
  t.deepEqual(client.config(), Object.assign({url}, clientConfig))
  client.config({dataset: 'bar'})
  t.deepEqual(client.config(), Object.assign({url}, clientConfig, {dataset: 'bar'}))

  return client.delete('doc').then(res => t.is(res.transactionId, 'bar'))
})

test('can change client configuration in pre-request hook', t => {
  nock(baseUrl).post('/76bc/v1/data/q/bar', {query: '*'}).reply(200, {ms: 1337, result: []})

  const client = getClient()
  return client
    .on('request', () => client.config({dataset: 'bar'}))
    .fetch('*')
    .then(res => t.is(res.ms, 1337))
})

test('can create a new dataset', t => {
  nock(baseUrl).put('/76bc/v1/datasets/unicorns').reply(200)
  t.notThrows(getClient().createDataset('unicorns'))
})

test('rejects if dataset creation fails', t => {
  nock(baseUrl).put('/76bc/v1/datasets/ponies').reply(400, {
    error: 'Dataset "ponies" already exists'
  })
  t.throws(getClient().createDataset('ponies'))
})

test('can delete a dataset', t => {
  nock(baseUrl).delete('/76bc/v1/datasets/unicorns').reply(200)
  t.notThrows(getClient().deleteDataset('unicorns'))
})

test('rejects if dataset deletion fails', t => {
  nock(baseUrl).delete('/76bc/v1/datasets/ponies').reply(400, {
    error: 'Dataset "ponies" does not exist'
  })
  t.throws(getClient().deleteDataset('ponies'))
})

test('sends token header if token is set (data)', t => {
  nock(baseUrl, {reqheaders: {'Sanity-Token': 'fjasebengel'}})
    .post('/76bc/v1/data/q/foo', {query: 'query'})
    .reply(200, {
      ms: 123,
      result: []
    })

  return getClient({token: 'fjasebengel'}).fetch('query')
})

test('sends token header if token is set (datasets)', t => {
  nock(baseUrl, {reqheaders: {'Sanity-Token': 'fjasebengel'}})
    .put('/76bc/v1/datasets/fiskesaus')
    .reply(200)

  return getClient({token: 'fjasebengel'}).createDataset('fiskesaus')
})
