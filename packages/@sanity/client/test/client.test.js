/* eslint-disable strict */
// (Node 4 compat)

'use strict'

require('hard-rejection/register')

const test = require('tape')
const nock = require('nock')
const assign = require('xtend')
const path = require('path')
const fs = require('fs')
const validators = require('../src/validators')
const observableOf = require('rxjs').of
const {filter} = require('rxjs/operators')
const sanityClient = require('../src/sanityClient')

const SanityClient = sanityClient
const noop = () => {} // eslint-disable-line no-empty-function
const bufferFrom = (content, enc) =>
  Buffer.from ? Buffer.from(content, enc) : new Buffer(content, enc) // eslint-disable-line no-buffer-constructor

const apiHost = 'api.sanity.url'
const defaultProjectId = 'bf1942'
const projectHost = (projectId) => `https://${projectId || defaultProjectId}.${apiHost}`
const clientConfig = {
  apiHost: `https://${apiHost}`,
  projectId: 'bf1942',
  dataset: 'foo',
  useCdn: false,
}

const getClient = (conf) => sanityClient(assign({}, clientConfig, conf || {}))
const fixture = (name) => path.join(__dirname, 'fixtures', name)
const ifError = (t) => (err) => {
  t.ifError(err)
  if (err) {
    t.end()
  }
}

/*****************
 * BASE CLIENT   *
 *****************/
test('can construct client with new keyword', (t) => {
  const client = new SanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')
  t.end()
})

test('can construct client without new keyword', (t) => {
  const client = sanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')
  t.end()
})

test('can get and set config', (t) => {
  const client = sanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')
  t.equal(client.config({projectId: 'def456'}), client, 'returns client on set')
  t.equal(client.config().projectId, 'def456', 'new config is set')
  t.end()
})

test('config getter returns a cloned object', (t) => {
  const client = sanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')
  const config = client.config()
  config.projectId = 'def456'
  t.equal(client.config().projectId, 'abc123', 'returned object does not mutate client config')
  t.end()
})

test('calling config() reconfigures observable API too', (t) => {
  const client = sanityClient({projectId: 'abc123'})

  client.config({projectId: 'def456'})
  t.equal(client.observable.config().projectId, 'def456', 'Observable API gets reconfigured')
  t.end()
})

test('can clone client', (t) => {
  const client = sanityClient({projectId: 'abc123'})
  t.equal(client.config().projectId, 'abc123', 'constructor opts are set')

  const client2 = client.clone()
  client2.config({projectId: 'def456'})
  t.equal(client.config().projectId, 'abc123')
  t.equal(client2.config().projectId, 'def456')
  t.end()
})

test('throws if no projectId is set', (t) => {
  t.throws(sanityClient, /projectId/)
  t.end()
})

test('throws on invalid project ids', (t) => {
  t.throws(() => sanityClient({projectId: '*foo*'}), /projectId.*?can only contain/i)
  t.end()
})

test('throws on invalid dataset names', (t) => {
  t.throws(
    () => sanityClient({projectId: 'abc123', dataset: '*foo*'}),
    /Datasets can only contain/i
  )
  t.end()
})

test('can use request() for API-relative requests', (t) => {
  nock(projectHost()).get('/v1/ping').reply(200, {pong: true})

  getClient()
    .request({uri: '/ping'})
    .then((res) => t.equal(res.pong, true))
    .catch(t.ifError)
    .then(t.end)
})

test('can use getUrl() to get API-relative paths', (t) => {
  t.equal(getClient().getUrl('/bar/baz'), `${projectHost()}/v1/bar/baz`)
  t.end()
})

test('validation', (t) => {
  t.doesNotThrow(
    () => validators.validateDocumentId('op', 'barfoo'),
    /document ID in format/,
    'does not throw on valid ID'
  )
  t.doesNotThrow(
    () => validators.validateDocumentId('op', 'bar.foo.baz'),
    /document ID in format/,
    'does not throw on valid ID'
  )
  t.throws(
    () => validators.validateDocumentId('op', 'blah#blah'),
    /not a valid document ID/,
    'throws on invalid ID'
  )
  t.end()
})

/*****************
 * PROJECTS      *
 *****************/
test('can request list of projects', (t) => {
  nock(`https://${apiHost}`)
    .get('/v1/projects')
    .reply(200, [{projectId: 'foo'}, {projectId: 'bar'}])

  const client = sanityClient({useProjectHostname: false, apiHost: `https://${apiHost}`})
  client.projects
    .list()
    .then((projects) => {
      t.equal(projects.length, 2, 'should have two projects')
      t.equal(projects[0].projectId, 'foo', 'should have project id')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can request project by id', (t) => {
  const doc = {
    _id: 'projects.n1f7y',
    projectId: 'n1f7y',
    displayName: 'Movies Unlimited',
    studioHost: 'movies',
    members: [
      {
        id: 'someuserid',
        role: 'administrator',
      },
    ],
  }

  nock(`https://${apiHost}`).get('/v1/projects/n1f7y').reply(200, doc)

  const client = sanityClient({useProjectHostname: false, apiHost: `https://${apiHost}`})
  client.projects
    .getById('n1f7y')
    .then((project) => t.deepEqual(project, doc))
    .catch(t.ifError)
    .then(t.end)
})

/*****************
 * DATASETS      *
 *****************/
test('throws when trying to create dataset with invalid name', (t) => {
  t.throws(() => getClient().datasets.create('*foo*'), /Datasets can only contain/i)
  t.end()
})

test('throws when trying to delete dataset with invalid name', (t) => {
  t.throws(() => getClient().datasets.delete('*foo*'), /Datasets can only contain/i)
  t.end()
})

test('can create dataset', (t) => {
  nock(projectHost()).put('/v1/datasets/bar').reply(200)
  getClient().datasets.create('bar').catch(t.ifError).then(t.end)
})

test('can delete dataset', (t) => {
  nock(projectHost()).delete('/v1/datasets/bar').reply(200)
  getClient().datasets.delete('bar').catch(t.ifError).then(t.end)
})

test('can list datasets', (t) => {
  nock(projectHost()).get('/v1/datasets').reply(200, ['foo', 'bar'])
  getClient()
    .datasets.list()
    .then((sets) => {
      t.deepEqual(sets, ['foo', 'bar'])
    })
    .catch(t.ifError)
    .then(t.end)
})

/*****************
 * DATA          *
 *****************/
test('can query for documents', (t) => {
  const query = 'beerfiesta.beer[.title == $beerName]'
  const params = {beerName: 'Headroom Double IPA'}
  const qs =
    'beerfiesta.beer%5B.title%20%3D%3D%20%24beerName%5D&%24beerName=%22Headroom%20Double%20IPA%22'

  nock(projectHost())
    .get(`/v1/data/query/foo?query=${qs}`)
    .reply(200, {
      ms: 123,
      q: query,
      result: [{_id: 'njgNkngskjg', rating: 5}],
    })

  getClient()
    .fetch(query, params)
    .then((res) => {
      t.equal(res.length, 1, 'length should match')
      t.equal(res[0].rating, 5, 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can query for documents and return full response', (t) => {
  const query = 'beerfiesta.beer[.title == $beerName]'
  const params = {beerName: 'Headroom Double IPA'}
  const qs =
    'beerfiesta.beer%5B.title%20%3D%3D%20%24beerName%5D&%24beerName=%22Headroom%20Double%20IPA%22'

  nock(projectHost())
    .get(`/v1/data/query/foo?query=${qs}`)
    .reply(200, {
      ms: 123,
      q: query,
      result: [{_id: 'njgNkngskjg', rating: 5}],
    })

  getClient()
    .fetch(query, params, {filterResponse: false})
    .then((res) => {
      t.equal(res.ms, 123, 'should include timing info')
      t.equal(res.q, query, 'should include query')
      t.equal(res.result.length, 1, 'length should match')
      t.equal(res.result[0].rating, 5, 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('handles api errors gracefully', (t) => {
  const response = {
    statusCode: 403,
    error: 'Forbidden',
    message: 'You are not allowed to access this resource',
  }

  nock(projectHost()).get('/v1/data/query/foo?query=area51').times(5).reply(403, response)

  getClient()
    .fetch('area51')
    .then((res) => {
      t.fail('Resolve handler should not be called on failure')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes(response.error), 'should contain error code')
      t.ok(err.message.includes(response.message), 'should contain error message')
      t.ok(err.responseBody.includes(response.message), 'responseBody should be populated')
      t.end()
    })
})

test('handles db errors gracefully', (t) => {
  const response = {
    error: {
      column: 13,
      line: 'foo.bar.baz  12#[{',
      lineNumber: 1,
      description: 'Unable to parse entire expression',
      query: 'foo.bar.baz  12#[{',
      type: 'gqlParseError',
    },
  }

  nock(projectHost())
    .get('/v1/data/query/foo?query=foo.bar.baz%20%2012%23%5B%7B')
    .reply(400, response)

  getClient()
    .fetch('foo.bar.baz  12#[{')
    .then((res) => {
      t.fail('Resolve handler should not be called on failure')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes(response.error.description), 'should contain error description')
      t.equal(err.details.column, response.error.column, 'error should have details object')
      t.equal(err.details.line, response.error.line, 'error should have details object')
      t.end()
    })
})

test('can query for single document', (t) => {
  nock(projectHost())
    .get('/v1/data/doc/foo/abc123')
    .reply(200, {
      ms: 123,
      documents: [{_id: 'abc123', mood: 'lax'}],
    })

  getClient()
    .getDocument('abc123')
    .then((res) => {
      t.equal(res.mood, 'lax', 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can query for multiple documents', (t) => {
  nock(projectHost())
    .get('/v1/data/doc/foo/abc123,abc321')
    .reply(200, {
      ms: 123,
      documents: [
        {_id: 'abc123', mood: 'lax'},
        {_id: 'abc321', mood: 'tense'},
      ],
    })

  getClient()
    .getDocuments(['abc123', 'abc321'])
    .then(([abc123, abc321]) => {
      t.equal(abc123.mood, 'lax', 'data should match')
      t.equal(abc321.mood, 'tense', 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('preserves the position of requested documents', (t) => {
  nock(projectHost())
    .get('/v1/data/doc/foo/abc123,abc321,abc456')
    .reply(200, {
      ms: 123,
      documents: [
        {_id: 'abc456', mood: 'neutral'},
        {_id: 'abc321', mood: 'tense'},
      ],
    })

  getClient()
    .getDocuments(['abc123', 'abc321', 'abc456'])
    .then(([abc123, abc321, abc456]) => {
      t.equal(abc123, null, 'first item should be null')
      t.equal(abc321.mood, 'tense', 'data should match')
      t.equal(abc456.mood, 'neutral', 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('gives http statuscode as error if no body is present on errors', (t) => {
  nock(projectHost()).get('/v1/data/doc/foo/abc123').reply(400)

  getClient()
    .getDocument('abc123')
    .then((res) => {
      t.fail('Resolve handler should not be called on failure')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes('HTTP 400'), 'should contain status code')
      t.end()
    })
})

test('populates response body on errors', (t) => {
  nock(projectHost()).get('/v1/data/doc/foo/abc123').times(5).reply(400, 'Some Weird Error')

  getClient()
    .getDocument('abc123')
    .then((res) => {
      t.fail('Resolve handler should not be called on failure')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes('HTTP 400'), 'should contain status code')
      t.ok((err.responseBody || '').includes('Some Weird Error'), 'body populated')
      t.end()
    })
})

test('throws if trying to perform data request without dataset', (t) => {
  t.throws(
    () => sanityClient({projectId: 'foo'}).fetch('blah'),
    Error,
    /dataset.*?must be provided/
  )
  t.end()
})

test('can create documents', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}

  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', {
      mutations: [{create: doc}],
    })
    .reply(200, {
      transactionId: 'abc123',
      results: [
        {
          document: {_id: 'abc123', _createdAt: '2016-10-24T08:09:32.997Z', name: 'Raptor'},
          operation: 'create',
        },
      ],
    })

  getClient()
    .create(doc)
    .then((res) => {
      t.equal(res._id, doc._id, 'document id returned')
      t.ok(res._createdAt, 'server-generated attributes are included')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can create documents without specifying ID', (t) => {
  const doc = {name: 'Raptor'}
  const expectedBody = {mutations: [{create: Object.assign({}, doc)}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {
      transactionId: '123abc',
      results: [
        {
          id: 'abc456',
          document: {_id: 'abc456', name: 'Raptor'},
        },
      ],
    })

  getClient()
    .create(doc)
    .then((res) => {
      t.equal(res._id, 'abc456', 'document id returned')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can tell create() not to return documents', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', {mutations: [{create: doc}]})
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'create'}]})

  getClient()
    .create(doc, {returnDocuments: false})
    .then((res) => {
      t.equal(res.transactionId, 'abc123', 'returns transaction ID')
      t.equal(res.documentId, 'abc123', 'returns document id')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('can tell create() to use non-default visibility mode', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=async', {
      mutations: [{create: doc}],
    })
    .reply(200, {
      transactionId: 'abc123',
      results: [{id: 'abc123', document: doc, operation: 'create'}],
    })

  getClient()
    .create(doc, {visibility: 'async'})
    .then((res) => {
      t.equal(res._id, 'abc123', 'document id returned')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('createIfNotExists() sends correct mutation', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  const expectedBody = {mutations: [{createIfNotExists: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {
      transactionId: '123abc',
      results: [{id: 'abc123', document: doc, operation: 'create'}],
    })

  getClient()
    .createIfNotExists(doc)
    .catch(t.ifError)
    .then(() => t.end())
})

test('can tell createIfNotExists() not to return documents', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  const expectedBody = {mutations: [{createIfNotExists: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'create'}]})

  getClient()
    .createIfNotExists(doc, {returnDocuments: false})
    .then((res) => {
      t.equal(res.transactionId, 'abc123', 'returns transaction ID')
      t.equal(res.documentId, 'abc123', 'returns document id')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('createOrReplace() sends correct mutation', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  const expectedBody = {mutations: [{createOrReplace: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: '123abc', results: [{id: 'abc123', operation: 'create'}]})

  getClient().createOrReplace(doc).catch(t.ifError).then(t.end)
})

test('can tell createOrReplace() not to return documents', (t) => {
  const doc = {_id: 'abc123', name: 'Raptor'}
  const expectedBody = {mutations: [{createOrReplace: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'create'}]})

  getClient()
    .createOrReplace(doc, {returnDocuments: false})
    .then((res) => {
      t.equal(res.transactionId, 'abc123', 'returns transaction ID')
      t.equal(res.documentId, 'abc123', 'returns document id')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('delete() sends correct mutation', (t) => {
  const expectedBody = {mutations: [{delete: {id: 'abc123'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'delete'}]})

  getClient()
    .delete('abc123')
    .catch(t.ifError)
    .then(() => t.end())
})

test('delete() can use query', (t) => {
  const expectedBody = {mutations: [{delete: {query: 'foo.sometype'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123'})

  getClient()
    .delete({query: 'foo.sometype'})
    .catch(t.ifError)
    .then(() => t.end())
})

test('delete() can be told not to return documents', (t) => {
  const expectedBody = {mutations: [{delete: {id: 'abc123'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'delete'}]})

  getClient()
    .delete('abc123', {returnDocuments: false})
    .catch(t.ifError)
    .then(() => t.end())
})

test('mutate() accepts multiple mutations', (t) => {
  const docs = [
    {
      _id: 'movies.raiders-of-the-lost-ark',
      title: 'Raiders of the Lost Ark',
      year: 1981,
    },
    {
      _id: 'movies.the-phantom-menace',
      title: 'Star Wars: Episode I - The Phantom Menace',
      year: 1999,
    },
  ]

  const mutations = [{create: docs[0]}, {delete: {id: 'movies.the-phantom-menace'}}]

  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', {mutations})
    .reply(200, {
      transactionId: 'foo',
      results: [
        {id: 'movies.raiders-of-the-lost-ark', operation: 'create', document: docs[0]},
        {id: 'movies.the-phantom-menace', operation: 'delete', document: docs[1]},
      ],
    })

  getClient()
    .mutate(mutations)
    .catch(t.ifError)
    .then(() => t.end())
})

test('uses GET for queries below limit', (t) => {
  // Please dont ever do this. Just... don't.
  const clause = []
  const qParams = {}
  const params = {}
  for (let i = 1950; i <= 2016; i++) {
    clause.push(`title == $beerName${i}`)
    params[`beerName${i}`] = `some beer ${i}`
    qParams[`$beerName${i}`] = JSON.stringify(`some beer ${i}`)
  }

  // Again, just... don't do this.
  const query = `*[is "beer" && (${clause.join(' || ')})]`

  nock(projectHost())
    .get('/v1/data/query/foo')
    .query(Object.assign({query}, qParams))
    .reply(200, {
      ms: 123,
      q: query,
      result: [{_id: 'njgNkngskjg', rating: 5}],
    })

  getClient()
    .fetch(query, params)
    .then((res) => {
      t.equal(res.length, 1, 'length should match')
      t.equal(res[0].rating, 5, 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('uses POST for long queries', (t) => {
  // Please dont ever do this. Just... don't.
  const clause = []
  const params = {}
  for (let i = 1866; i <= 2016; i++) {
    clause.push(`title == $beerName${i}`)
    params[`beerName${i}`] = `some beer ${i}`
  }

  // Again, just... don't do this.
  const query = `*[is "beer" && (${clause.join(' || ')})]`

  nock(projectHost())
    .filteringRequestBody(/.*/, '*')
    .post('/v1/data/query/foo', '*')
    .reply(200, {
      ms: 123,
      q: query,
      result: [{_id: 'njgNkngskjg', rating: 5}],
    })

  getClient()
    .fetch(query, params)
    .then((res) => {
      t.equal(res.length, 1, 'length should match')
      t.equal(res[0].rating, 5, 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

/*****************
 * PATCH OPS     *
 *****************/
test('can build and serialize a patch of operations', (t) => {
  const patch = getClient().patch('abc123').inc({count: 1}).set({brownEyes: true}).serialize()

  t.deepEqual(patch, {id: 'abc123', inc: {count: 1}, set: {brownEyes: true}})
  t.end()
})

test('patch() can take an array of IDs', (t) => {
  const patch = getClient().patch(['abc123', 'foo.456']).inc({count: 1}).serialize()
  t.deepEqual(patch, {id: ['abc123', 'foo.456'], inc: {count: 1}})
  t.end()
})

test('patch() can take a query', (t) => {
  const patch = getClient().patch({query: 'beerfiesta.beer'}).inc({count: 1}).serialize()
  t.deepEqual(patch, {query: 'beerfiesta.beer', inc: {count: 1}})
  t.end()
})

test('merge() patch can be applied multiple times', (t) => {
  const patch = getClient()
    .patch('abc123')
    .merge({count: 1, foo: 'bar'})
    .merge({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'abc123', merge: {count: 2, foo: 'bar', bar: 'foo'}})
  t.end()
})

test('setIfMissing() patch can be applied multiple times', (t) => {
  const patch = getClient()
    .patch('abc123')
    .setIfMissing({count: 1, foo: 'bar'})
    .setIfMissing({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'abc123', setIfMissing: {count: 2, foo: 'bar', bar: 'foo'}})
  t.end()
})

test('only last replace() patch call gets applied', (t) => {
  const patch = getClient()
    .patch('abc123')
    .replace({count: 1, foo: 'bar'})
    .replace({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'abc123', set: {$: {count: 2, bar: 'foo'}}})
  t.end()
})

test('can apply inc() and dec()', (t) => {
  const patch = getClient()
    .patch('abc123')
    .inc({count: 1}) // One step forward
    .dec({count: 2}) // Two steps back
    .serialize()

  t.deepEqual(patch, {id: 'abc123', inc: {count: 1}, dec: {count: 2}})
  t.end()
})

test('can apply unset()', (t) => {
  const patch = getClient()
    .patch('abc123')
    .inc({count: 1})
    .unset(['bitter', 'enchilada'])
    .serialize()

  t.deepEqual(patch, {id: 'abc123', inc: {count: 1}, unset: ['bitter', 'enchilada']})
  t.end()
})

test('throws if non-array is passed to unset()', (t) => {
  t.throws(() => getClient().patch('abc123').unset('bitter').serialize(), /non-array given/)
  t.end()
})

test('can apply insert()', (t) => {
  const patch = getClient()
    .patch('abc123')
    .inc({count: 1})
    .insert('after', 'tags[-1]', ['hotsauce'])
    .serialize()

  t.deepEqual(patch, {
    id: 'abc123',
    inc: {count: 1},
    insert: {after: 'tags[-1]', items: ['hotsauce']},
  })
  t.end()
})

test('throws on invalid insert()', (t) => {
  t.throws(
    () => getClient().patch('abc123').insert('bitter', 'sel', ['raf']),
    /one of: "before", "after", "replace"/
  )

  t.throws(() => getClient().patch('abc123').insert('before', 123, ['raf']), /must be a string/)

  t.throws(() => getClient().patch('abc123').insert('before', 'prop', 'blah'), /must be an array/)
  t.end()
})

test('can apply append()', (t) => {
  const patch = getClient().patch('abc123').inc({count: 1}).append('tags', ['sriracha']).serialize()

  t.deepEqual(patch, {
    id: 'abc123',
    inc: {count: 1},
    insert: {after: 'tags[-1]', items: ['sriracha']},
  })
  t.end()
})

test('can apply prepend()', (t) => {
  const patch = getClient()
    .patch('abc123')
    .inc({count: 1})
    .prepend('tags', ['sriracha', 'hotsauce'])
    .serialize()

  t.deepEqual(patch, {
    id: 'abc123',
    inc: {count: 1},
    insert: {before: 'tags[0]', items: ['sriracha', 'hotsauce']},
  })
  t.end()
})

test('can apply splice()', (t) => {
  const patch = () => getClient().patch('abc123')
  const replaceFirst = patch().splice('tags', 0, 1, ['foo']).serialize()
  const insertInMiddle = patch().splice('tags', 5, 0, ['foo']).serialize()
  const deleteLast = patch().splice('tags', -1, 1).serialize()
  const deleteAllFromIndex = patch().splice('tags', 3, -1).serialize()
  const allFromIndexDefault = patch().splice('tags', 3).serialize()
  const negativeDelete = patch().splice('tags', -2, -2, ['foo']).serialize()

  t.deepEqual(replaceFirst.insert, {replace: 'tags[0:1]', items: ['foo']})
  t.deepEqual(insertInMiddle.insert, {replace: 'tags[5:5]', items: ['foo']})
  t.deepEqual(deleteLast.insert, {replace: 'tags[-2:]', items: []})
  t.deepEqual(deleteAllFromIndex.insert, {replace: 'tags[3:-1]', items: []})
  t.deepEqual(allFromIndexDefault.insert, {replace: 'tags[3:-1]', items: []})
  t.deepEqual(negativeDelete, patch().splice('tags', -2, 0, ['foo']).serialize())
  t.end()
})

test('serializing invalid selectors throws', (t) => {
  t.throws(() => getClient().patch(123).serialize(), /unknown selection/i)
  t.end()
})

test('can apply diffMatchPatch()', (t) => {
  const patch = getClient()
    .patch('abc123')
    .inc({count: 1})
    .diffMatchPatch({description: '@@ -1,13 +1,12 @@\n The \n-rabid\n+nice\n  dog\n'})
    .serialize()

  t.deepEqual(patch, {
    id: 'abc123',
    inc: {count: 1},
    diffMatchPatch: {description: '@@ -1,13 +1,12 @@\n The \n-rabid\n+nice\n  dog\n'},
  })
  t.end()
})

test('all patch methods throw on non-objects being passed as argument', (t) => {
  const patch = getClient().patch('abc123')
  t.throws(() => patch.merge([]), /merge\(\) takes an object of properties/, 'merge throws')
  t.throws(() => patch.set(null), /set\(\) takes an object of properties/, 'set throws')
  t.throws(
    () => patch.setIfMissing('foo'),
    /setIfMissing\(\) takes an object of properties/,
    'setIfMissing throws'
  )
  t.throws(
    () => patch.replace('foo'),
    /replace\(\) takes an object of properties/,
    'replace throws'
  )
  t.throws(() => patch.inc('foo'), /inc\(\) takes an object of properties/, 'inc throws')
  t.throws(() => patch.dec('foo'), /dec\(\) takes an object of properties/, 'dec throws')
  t.throws(
    () => patch.diffMatchPatch('foo'),
    /diffMatchPatch\(\) takes an object of properties/,
    'diffMatchPatch throws'
  )
  t.end()
})

test('executes patch when commit() is called', (t) => {
  const expectedPatch = {patch: {id: 'abc123', inc: {count: 1}, set: {visited: true}}}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', {mutations: [expectedPatch]})
    .reply(200, {transactionId: 'blatti'})

  getClient()
    .patch('abc123')
    .inc({count: 1})
    .set({visited: true})
    .commit({returnDocuments: false})
    .then((res) => {
      t.equal(res.transactionId, 'blatti', 'applies given patch')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('executes patch with given token override commit() is called', (t) => {
  const expectedPatch = {patch: {id: 'abc123', inc: {count: 1}, set: {visited: true}}}
  nock(projectHost(), {reqheaders: {Authorization: 'Bearer abc123'}})
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', {mutations: [expectedPatch]})
    .reply(200, {transactionId: 'blatti'})

  getClient()
    .patch('abc123')
    .inc({count: 1})
    .set({visited: true})
    .commit({returnDocuments: false, token: 'abc123'})
    .then((res) => {
      t.equal(res.transactionId, 'blatti', 'applies given patch')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('returns patched document by default', (t) => {
  const expectedPatch = {patch: {id: 'abc123', inc: {count: 1}, set: {visited: true}}}
  const expectedBody = {mutations: [expectedPatch]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {
      transactionId: 'blatti',
      results: [
        {
          id: 'abc123',
          operation: 'update',
          document: {
            _id: 'abc123',
            _createdAt: '2016-10-24T08:09:32.997Z',
            count: 2,
            visited: true,
          },
        },
      ],
    })

  getClient()
    .patch('abc123')
    .inc({count: 1})
    .set({visited: true})
    .commit()
    .then((res) => {
      t.equal(res._id, 'abc123', 'returns patched document')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('commit() returns promise', (t) => {
  const expectedPatch = {patch: {id: 'abc123', inc: {count: 1}, set: {visited: true}}}
  const expectedBody = {mutations: [expectedPatch]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(400)

  getClient()
    .patch('abc123')
    .inc({count: 1})
    .set({visited: true})
    .commit()
    .catch((err) => {
      t.ok(err instanceof Error, 'should call applied error handler')
      t.end()
    })
})

test('each patch operation returns same patch', (t) => {
  const patch = getClient().patch('abc123')
  const inc = patch.inc({count: 1})
  const dec = patch.dec({count: 1})
  const combined = inc.dec({count: 1})

  t.equal(patch, inc, 'should return same patch')
  t.equal(inc, dec, 'should return same patch')
  t.equal(inc, combined, 'should return same patch')

  t.deepEqual(
    combined.serialize(),
    {id: 'abc123', inc: {count: 1}, dec: {count: 1}},
    'combined patch should have both inc and dec ops'
  )

  t.end()
})

test('can reset patches to no operations, keeping document ID', (t) => {
  const patch = getClient().patch('abc123').inc({count: 1}).dec({visits: 1})
  const reset = patch.reset()

  t.deepEqual(patch.serialize(), {id: 'abc123'}, 'correct patch')
  t.deepEqual(reset.serialize(), {id: 'abc123'}, 'reset patch should be empty')
  t.equal(patch, reset, 'reset mutates, does not clone')
  t.end()
})

test('patch has toJSON() which serializes patch', (t) => {
  const patch = getClient().patch('abc123').inc({count: 1})
  t.deepEqual(
    JSON.parse(JSON.stringify(patch)),
    JSON.parse(JSON.stringify({id: 'abc123', inc: {count: 1}}))
  )
  t.end()
})

test('Patch is available on client and can be used without instantiated client', (t) => {
  const patch = new sanityClient.Patch('foo.bar')
  t.deepEqual(
    patch.inc({foo: 1}).dec({bar: 2}).serialize(),
    {id: 'foo.bar', inc: {foo: 1}, dec: {bar: 2}},
    'patch should work without context'
  )
  t.end()
})

test('patch commit() throws if called without a client', (t) => {
  const patch = new sanityClient.Patch('foo.bar')
  t.throws(() => patch.dec({bar: 2}).commit(), /client.*mutate/i)
  t.end()
})

test('can manually call clone on patch', (t) => {
  const patch1 = getClient().patch('abc123').inc({count: 1})
  const patch2 = patch1.clone()

  t.notEqual(patch1, patch2, 'actually cloned')
  t.deepEqual(patch1.serialize(), patch2.serialize(), 'serialized to the same')
  t.end()
})

test('can apply ifRevisionId constraint', (t) => {
  t.deepEqual(
    getClient().patch('abc123').inc({count: 1}).ifRevisionId('someRev').serialize(),
    {id: 'abc123', inc: {count: 1}, ifRevisionID: 'someRev'},
    'patch should be able to apply ifRevisionId constraint'
  )
  t.end()
})

/*****************
 * TRANSACTIONS  *
 *****************/
test('can build and serialize a transaction of operations', (t) => {
  const trans = getClient()
    .transaction()
    .create({_id: 'moofoo', name: 'foobar'})
    .delete('nznjkAJnjgnk')
    .serialize()

  t.deepEqual(trans, [{create: {_id: 'moofoo', name: 'foobar'}}, {delete: {id: 'nznjkAJnjgnk'}}])
  t.end()
})

test('each transaction operation mutates transaction', (t) => {
  const trans = getClient().transaction()
  const create = trans.create({count: 1})
  const combined = create.delete('foobar')

  t.equal(trans, create, 'should be mutated')
  t.equal(create, combined, 'should be mutated')

  t.deepEqual(
    combined.serialize(),
    [{create: {count: 1}}, {delete: {id: 'foobar'}}],
    'combined transaction should have both create and delete ops'
  )

  t.end()
})

test('transaction methods are chainable', (t) => {
  const trans = getClient()
    .transaction()
    .create({moo: 'tools'})
    .createIfNotExists({_id: 'someId', j: 'query'})
    .createOrReplace({_id: 'someOtherId', do: 'jo'})
    .delete('prototype')
    .patch('foobar', {inc: {sales: 1}})

  t.deepEqual(trans.serialize(), [
    {
      create: {
        moo: 'tools',
      },
    },
    {
      createIfNotExists: {
        _id: 'someId',
        j: 'query',
      },
    },
    {
      createOrReplace: {
        _id: 'someOtherId',
        do: 'jo',
      },
    },
    {
      delete: {
        id: 'prototype',
      },
    },
    {
      patch: {
        id: 'foobar',
        inc: {sales: 1},
      },
    },
  ])

  t.equal(trans.reset().serialize().length, 0, 'resets to 0 operations')
  t.end()
})

test('patches can be built with callback', (t) => {
  const trans = getClient()
    .transaction()
    .patch('moofoo', (p) => p.inc({sales: 1}).dec({stock: 1}))
    .serialize()

  t.deepEqual(trans, [
    {
      patch: {
        id: 'moofoo',
        inc: {sales: 1},
        dec: {stock: 1},
      },
    },
  ])
  t.end()
})

test('throws if patch builder does not return patch', (t) => {
  t.throws(() => getClient().transaction().patch('moofoo', noop), /must return the patch/)
  t.end()
})

test('patch can take an existing patch', (t) => {
  const client = getClient()
  const incPatch = client.patch('bar').inc({sales: 1})
  const trans = getClient().transaction().patch(incPatch).serialize()

  t.deepEqual(trans, [
    {
      patch: {
        id: 'bar',
        inc: {sales: 1},
      },
    },
  ])
  t.end()
})

test('executes transaction when commit() is called', (t) => {
  const mutations = [{create: {bar: true}}, {delete: {id: 'barfoo'}}]
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', {mutations})
    .reply(200, {transactionId: 'blatti'})

  getClient()
    .transaction()
    .create({bar: true})
    .delete('barfoo')
    .commit()
    .then((res) => {
      t.equal(res.transactionId, 'blatti', 'applies given transaction')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('throws when passing incorrect input to transaction operations', (t) => {
  const trans = getClient().transaction()
  t.throws(() => trans.create('foo'), /object of prop/, 'throws on create()')
  t.throws(() => trans.createIfNotExists('foo'), /object of prop/, 'throws on createIfNotExists()')
  t.throws(() => trans.createOrReplace('foo'), /object of prop/, 'throws on createOrReplace()')
  t.throws(() => trans.delete({id: 'moofoo'}), /not a valid document ID/, 'throws on delete()')
  t.end()
})

test('throws when not including document ID in createOrReplace/createIfNotExists in transaction', (t) => {
  const trans = getClient().transaction()
  t.throws(
    () => trans.createIfNotExists({_type: 'movie', a: 1}),
    /contains an ID/,
    'throws on createIfNotExists()'
  )
  t.throws(
    () => trans.createOrReplace({_type: 'movie', a: 1}),
    /contains an ID/,
    'throws on createOrReplace()'
  )
  t.end()
})

test('can manually call clone on transaction', (t) => {
  const trans1 = getClient().transaction().delete('foo.bar')
  const trans2 = trans1.clone()

  t.notEqual(trans1, trans2, 'actually cloned')
  t.deepEqual(trans1.serialize(), trans2.serialize(), 'serialized to the same')
  t.end()
})

test('transaction has toJSON() which serializes patch', (t) => {
  const trans = getClient().transaction().create({count: 1})
  t.deepEqual(JSON.parse(JSON.stringify(trans)), JSON.parse(JSON.stringify([{create: {count: 1}}])))
  t.end()
})

test('Transaction is available on client and can be used without instantiated client', (t) => {
  const trans = new sanityClient.Transaction()
  t.deepEqual(
    trans.delete('barfoo').serialize(),
    [{delete: {id: 'barfoo'}}],
    'transaction should work without context'
  )
  t.end()
})

test('transaction can be created without client and passed to mutate()', (t) => {
  const trx = new sanityClient.Transaction()
  trx.delete('foo')

  const mutations = [{delete: {id: 'foo'}}]
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', {mutations})
    .reply(200, {results: [{id: 'foo', operation: 'delete'}]})

  getClient()
    .mutate(trx)
    .catch(t.ifError)
    .then(() => t.end())
})

test('transaction commit() throws if called without a client', (t) => {
  const trans = new sanityClient.Transaction()
  t.throws(() => trans.delete('foo.bar').commit(), /client.*mutate/i)
  t.end()
})

test('transaction can be given an explicit transaction ID', (t) => {
  const transactionId = 'moop'
  const mutations = [{create: {bar: true}}, {delete: {id: 'barfoo'}}]
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&visibility=sync', {mutations, transactionId})
    .reply(200, {transactionId})

  getClient()
    .transaction()
    .create({bar: true})
    .delete('barfoo')
    .transactionId(transactionId)
    .commit()
    .then((res) => {
      t.equal(res.transactionId, transactionId, 'applies given transaction')
    })
    .catch(t.ifError)
    .then(t.end)
})

/*****************
 * LISTENERS     *
 *****************/
test('listeners connect to listen endpoint, emits events', (t) => {
  const doc = {_id: 'mooblah', _type: 'foo.bar', prop: 'value'}
  const response = [
    ':',
    '',
    'event: welcome',
    'data: {"listenerName":"LGFXwOqrf1GHawAjZRnhd6"}',
    '',
    'event: mutation',
    `data: ${JSON.stringify({document: doc})}`,
    '',
    'event: disconnect',
    'data: {"reason":"forcefully closed"}',
  ].join('\n')

  nock(projectHost())
    .get('/v1/data/listen/foo?query=foo.bar&includeResult=true')
    .reply(200, response, {
      'cache-control': 'no-cache',
      'content-type': 'text/event-stream; charset=utf-8',
      'transfer-encoding': 'chunked',
    })

  const sub = getClient()
    .listen('foo.bar')
    .subscribe({
      next: (evt) => {
        sub.unsubscribe()
        t.deepEqual(evt.document, doc)
        t.end()
      },
      error: (err) => {
        sub.unsubscribe()
        t.ifError(err)
        t.fail('Should not call error handler')
        t.end()
      },
    })
})

/*****************
 * ASSETS        *
 *****************/
test('uploads images', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/images/foo', isImage)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath))
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('uploads images with given content type', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost(), {reqheaders: {'Content-Type': 'image/jpeg'}})
    .post('/v1/assets/images/foo', isImage)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath), {contentType: 'image/jpeg'})
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('uploads images with specified metadata to be extracted', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/images/foo?meta=palette&meta=location', isImage)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  const options = {extract: ['palette', 'location']}
  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath), options)
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('empty extract array sends `none` as metadata', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/images/foo?meta=none', isImage)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  const options = {extract: []}
  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath), options)
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('uploads images with progress events', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/images/foo', isImage)
    .reply(201, {url: 'https://some.asset.url'})

  // @todo write a test that asserts upload events (slowness)
  getClient()
    .observable.assets.upload('image', fs.createReadStream(fixturePath))
    .pipe(filter((event) => event.type === 'progress'))
    .subscribe(
      (event) => t.equal(event.type, 'progress'),
      ifError(t),
      () => t.end()
    )
})

test('uploads images with custom label', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0
  const label = 'xy zzy'
  nock(projectHost())
    .post(`/v1/assets/images/foo?label=${encodeURIComponent(label)}`, isImage)
    .reply(201, {document: {label: label}})

  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath), {label: label})
    .then((body) => {
      t.equal(body.label, label)
      t.end()
    }, ifError(t))
})

test('uploads files', (t) => {
  const fixturePath = fixture('pdf-sample.pdf')
  const isFile = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/files/foo', isFile)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  getClient()
    .assets.upload('file', fs.createReadStream(fixturePath))
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('uploads images and can cast to promise', (t) => {
  const fixturePath = fixture('horsehead-nebula.jpg')
  const isImage = (body) => bufferFrom(body, 'hex').compare(fs.readFileSync(fixturePath)) === 0

  nock(projectHost())
    .post('/v1/assets/images/foo', isImage)
    .reply(201, {document: {url: 'https://some.asset.url'}})

  getClient()
    .assets.upload('image', fs.createReadStream(fixturePath))
    .then((document) => {
      t.equal(document.url, 'https://some.asset.url')
      t.end()
    }, ifError(t))
})

test('delete assets', (t) => {
  const expectedBody = {mutations: [{delete: {id: 'image-abc123_foobar-123x123-png'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'delete'}]})

  getClient()
    .assets.delete('image', 'image-abc123_foobar-123x123-png')
    .catch(t.ifError)
    .then(() => t.end())
})

test('delete assets with prefix', (t) => {
  const expectedBody = {mutations: [{delete: {id: 'image-abc123_foobar-123x123-png'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'delete'}]})

  getClient()
    .assets.delete('image', 'abc123_foobar-123x123-png')
    .catch(t.ifError)
    .then(() => t.end())
})

test('delete assets given whole asset document', (t) => {
  const expectedBody = {mutations: [{delete: {id: 'image-abc123_foobar-123x123-png'}}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .reply(200, {transactionId: 'abc123', results: [{id: 'abc123', operation: 'delete'}]})

  const doc = {_id: 'image-abc123_foobar-123x123-png', _type: 'sanity.imageAsset'}
  getClient()
    .assets.delete(doc, 'image-abc123_foobar-123x123-png')
    .catch(t.ifError)
    .then(() => t.end())
})

test('can get an image URL from a reference ID string', (t) => {
  const url = getClient().assets.getImageUrl('image-someImageId-200x300-png')
  t.equal(url, 'https://cdn.sanity.io/images/bf1942/foo/someImageId-200x300.png')
  t.end()
})

test('can get an image URL from a reference object', (t) => {
  const url = getClient().assets.getImageUrl({_ref: 'image-someImageId-200x300-png'})
  t.equal(url, 'https://cdn.sanity.io/images/bf1942/foo/someImageId-200x300.png')
  t.end()
})

test('can get an image URL with added query string', (t) => {
  const url = getClient().assets.getImageUrl('image-someImageId-200x300-png', {
    w: 320,
    fit: 'crop',
    crop: 'bottom,right',
  })

  const base = 'https://cdn.sanity.io/images/bf1942/foo/someImageId-200x300.png'
  const qs = 'w=320&fit=crop&crop=bottom%2Cright'
  t.equal(url, [base, qs].join('?'))
  t.end()
})

test('throws if trying to get image URL from object without ref', (t) => {
  t.throws(() => {
    getClient().assets.getImageUrl({id: 'image-someImageId-200x300-png'})
  }, /object with a _ref/)
  t.end()
})

test('throws if trying to get image URL from string in invalid format', (t) => {
  t.throws(() => {
    getClient().assets.getImageUrl('file-someImageId-200x300-png')
  }, /Unsupported asset ID/)
  t.end()
})

/*****************
 * AUTH          *
 *****************/
test('can retrieve auth providers', (t) => {
  const response = {
    providers: [
      {
        name: 'providerid',
        title: 'providertitle',
        url: 'https://some/login/url',
      },
    ],
  }

  nock(projectHost()).get('/v1/auth/providers').reply(200, response)

  getClient()
    .auth.getLoginProviders()
    .then((body) => {
      t.deepEqual(body, response)
      t.end()
    }, ifError(t))
})

test('can logout', (t) => {
  nock(projectHost()).post('/v1/auth/logout').reply(200)

  getClient()
    .auth.logout()
    .then(() => t.end(), ifError(t))
})

/*****************
 * USERS         *
 *****************/
test('can retrieve user by id', (t) => {
  const response = {
    role: null,
    id: 'Z29vZA2MTc2MDY5MDI1MDA3MzA5MTAwOjozMjM',
    name: 'Mannen i Gata',
    email: 'some@email.com',
  }

  nock(projectHost()).get('/v1/users/me').reply(200, response)

  getClient()
    .users.getById('me')
    .then((body) => {
      t.deepEqual(body, response)
      t.end()
    }, ifError(t))
})

/*****************
 * CDN API USAGE *
 *****************/
test('will use live API by default', (t) => {
  const client = sanityClient({projectId: 'abc123', dataset: 'foo'})

  const response = {result: []}
  nock('https://abc123.api.sanity.io').get('/v1/data/query/foo?query=*').reply(200, response)

  client
    .fetch('*')
    .then((docs) => {
      t.equal(docs.length, 0)
    })
    .catch(t.ifError)
    .then(t.end)
})

test('will use CDN API if told to', (t) => {
  const client = sanityClient({projectId: 'abc123', dataset: 'foo', useCdn: true})

  const response = {result: []}
  nock('https://abc123.apicdn.sanity.io').get('/v1/data/query/foo?query=*').reply(200, response)

  client
    .fetch('*')
    .then((docs) => {
      t.equal(docs.length, 0)
    })
    .catch(t.ifError)
    .then(t.end)
})

test('will use live API for mutations', (t) => {
  const client = sanityClient({projectId: 'abc123', dataset: 'foo', useCdn: true})

  nock('https://abc123.api.sanity.io')
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync')
    .reply(200, {})

  client.create({_type: 'foo', title: 'yep'}).then(noop).catch(t.ifError).then(t.end)
})

test('will use live API if token is specified', (t) => {
  const client = sanityClient({
    projectId: 'abc123',
    dataset: 'foo',
    useCdn: true,
    token: 'foo',
  })

  const reqheaders = {Authorization: 'Bearer foo'}
  nock('https://abc123.api.sanity.io', {reqheaders})
    .get('/v1/data/query/foo?query=*')
    .reply(200, {result: []})

  client.fetch('*').then(noop).catch(t.ifError).then(t.end)
})

test('will use live API if withCredentials is set to true', (t) => {
  const client = sanityClient({
    withCredentials: true,
    projectId: 'abc123',
    dataset: 'foo',
    useCdn: true,
  })

  nock('https://abc123.api.sanity.io').get('/v1/data/query/foo?query=*').reply(200, {result: []})

  client.fetch('*').then(noop).catch(t.ifError).then(t.end)
})

/*****************
 * HTTP REQUESTS *
 *****************/

test('includes token if set', (t) => {
  const qs = '?query=foo.bar'
  const token = 'abcdefghijklmnopqrstuvwxyz'
  const reqheaders = {Authorization: `Bearer ${token}`}
  nock(projectHost(), {reqheaders}).get(`/v1/data/query/foo${qs}`).reply(200, {result: []})

  getClient({token})
    .fetch('foo.bar')
    .then((docs) => {
      t.equal(docs.length, 0)
    })
    .catch(t.ifError)
    .then(t.end)
})

test('allows overriding token', (t) => {
  const qs = '?query=foo.bar'
  const token = 'abcdefghijklmnopqrstuvwxyz'
  const override = '123456789'
  const reqheaders = {Authorization: `Bearer ${override}`}
  nock(projectHost(), {reqheaders}).get(`/v1/data/query/foo${qs}`).reply(200, {result: []})

  getClient({token})
    .fetch('foo.bar', {}, {token: override})
    .then((docs) => {
      t.equal(docs.length, 0)
    })
    .catch(t.ifError)
    .then(t.end)
})

test('allows overriding timeout', (t) => {
  const qs = `?query=${encodeURIComponent('*[][0]')}`
  nock(projectHost()).get(`/v1/data/query/foo${qs}`).reply(200, {result: []})

  getClient()
    .fetch('*[][0]', {}, {timeout: 60 * 1000})
    .then((docs) => {
      t.equal(docs.length, 0)
    })
    .catch(t.ifError)
    .then(t.end)
})

test('includes user agent in node', (t) => {
  const pkg = require('../package.json')
  const reqheaders = {'User-Agent': `${pkg.name} ${pkg.version}`}
  nock(projectHost(), {reqheaders}).get('/v1/data/doc/foo/bar').reply(200, {documents: []})

  getClient().getDocument('bar').catch(t.ifError).then(t.end)
})

// Don't rely on this unless you're working at Sanity Inc ;)
test('can use alternative http requester', (t) => {
  const requester = () =>
    observableOf({
      type: 'response',
      body: {documents: [{foo: 'bar'}]},
    })

  getClient({requester})
    .getDocument('foo.bar')
    .then((res) => {
      t.equal(res.foo, 'bar')
      t.end()
    })
    .catch((err) => {
      t.ifError(err)
      t.fail('should not call catch handler')
      t.end()
    })
})

test('ClientError includes message in stack', (t) => {
  const body = {error: {description: 'Invalid query'}}
  const error = new SanityClient.ClientError({statusCode: 400, headers: {}, body})
  t.ok(error.stack.includes(body.error.description))
  t.end()
})

test('ServerError includes message in stack', (t) => {
  const body = {error: 'Gateway Time-Out', message: 'The upstream service did not respond in time'}
  const error = new SanityClient.ClientError({statusCode: 504, headers: {}, body})
  t.ok(error.stack.includes(body.error))
  t.ok(error.stack.includes(body.message))
  t.end()
})

test('exposes ClientError', (t) => {
  t.equal(typeof sanityClient.ClientError, 'function')
  const error = new SanityClient.ClientError({statusCode: 400, headers: {}, body: {}})
  t.ok(error instanceof Error)
  t.ok(error instanceof sanityClient.ClientError)
  t.end()
})

test('exposes ServerError', (t) => {
  t.equal(typeof sanityClient.ServerError, 'function')
  const error = new SanityClient.ServerError({statusCode: 500, headers: {}, body: {}})
  t.ok(error instanceof Error)
  t.ok(error instanceof sanityClient.ServerError)
  t.end()
})

// Don't rely on this unless you're working at Sanity Inc ;)
test('exposes default requester', (t) => {
  t.equal(typeof sanityClient.requester, 'function')
  t.end()
})

test('handles HTTP errors gracefully', (t) => {
  const doc = {_id: 'barfoo', visits: 5}
  const expectedBody = {mutations: [{create: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .times(6)
    .replyWithError(new Error('Something went wrong'))

  getClient()
    .create(doc)
    .then(() => {
      t.fail('Should not call success handler on error')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.message, 'Something went wrong', 'has message')
      t.end()
    })
})

// @todo these tests are failing because `nock` doesn't work well with `timed-out`
test.skip('handles connection timeouts gracefully', (t) => {
  const doc = {_id: 'barfoo', visits: 5}
  const expectedBody = {mutations: [{create: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .socketDelay(75)
    .delay({head: 500, body: 750})
    .reply(200, {transactionId: 'abc123', documents: []})

  getClient({timeout: 150})
    .create(doc)
    .then(() => {
      t.fail('Should not call success handler on timeouts')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.code, 'ETIMEDOUT', `should have timeout error code, got err\n${err.toString()}`)
      t.end()
    })
})

// @todo these tests are failing because `nock` doesn't work well with `timed-out`
test.skip('handles socket timeouts gracefully', (t) => {
  const doc = {_id: 'barfoo', visits: 5}
  const expectedBody = {mutations: [{create: doc}]}
  nock(projectHost())
    .post('/v1/data/mutate/foo?returnIds=true&returnDocuments=true&visibility=sync', expectedBody)
    .socketDelay(1000)
    .reply(200)

  getClient({timeout: 150})
    .create(doc)
    .then(() => {
      t.fail('Should not call success handler on timeouts')
      t.end()
    })
    .catch((err) => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.code, 'ESOCKETTIMEDOUT', 'should have timeout error code')
      t.end()
    })
})
