const test = require('tape')
const nock = require('nock')
const assign = require('xtend')
const sanityClient = require('../src/sanityClient')
const noop = () => {} // eslint-disable-line no-empty-function

const apiHost = 'api.sanity.url'
const projectHost = (projectId = 'bf1942') => `https://${projectId}.${apiHost}`
const clientConfig = {apiHost: `https://${apiHost}`, projectId: 'bf1942', dataset: 'foo'}
const getClient = (conf = {}) => sanityClient(assign({}, clientConfig, conf))

/*****************
 * BASE CLIENT   *
 *****************/
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

test('throws on invalid project ids', t => {
  t.throws(
    () => sanityClient({projectId: '*foo*'}),
    /projectId.*?can only contain/i
  )
  t.end()
})

test('throws on invalid dataset names', t => {
  t.throws(
    () => sanityClient({projectId: 'abc123', dataset: '*foo*'}),
    /Datasets can only contain/i
  )
  t.end()
})

test('can add and emit events', t => {
  const state = {emitted: false}
  const client = getClient()
  t.equal(client.on('request', emitted => Object.assign(state, {emitted})), client, 'on() returns client')
  t.equal(typeof client.emit('request', 'foo').then, 'function', 'emit returns promise')
  t.equal(state.emitted, 'foo', 'event handler called')
  t.end()
})

test('throws when adding event handler of unknown type', t => {
  t.throws(() => getClient().on('foo', noop), /Unknown event type/i)
  t.end()
})

test('throws when adding event handler that is not a function', t => {
  t.throws(() => getClient().on('request', 'bar'), /must be a function/i)
  t.end()
})

test('throws when removing event handler of unknown type', t => {
  t.throws(() => getClient().removeListener('foo', noop), /Unknown event type/i)
  t.end()
})

test('does not throw when removing unregistered handler', t => {
  t.doesNotThrow(() => getClient().removeListener('request', noop))
  t.end()
})

test('does not throw when emitting without any handlers', t => {
  t.doesNotThrow(() => getClient().emit('request', 'foo'))
  t.end()
})

test('can remove registered handlers', t => {
  const state = {called: 0}
  const inc = () => state.called++
  const client = getClient()

  client.on('request', inc)
  client.emit('request', 'foo')
  client.removeListener('request', inc)
  client.emit('request', 'bar')

  t.equal(state.called, 1, 'count should be one')
  t.end()
})

/*****************
 * PROJECTS      *
 *****************/
test('can request list of projects', t => {
  nock(`https://${apiHost}`)
    .get('/v1/projects')
    .reply(200, [{projectId: 'foo'}, {projectId: 'bar'}])

  const client = sanityClient({useProjectHostname: false, apiHost: `https://${apiHost}`})
  client.projects.list().then(projects => {
    t.equal(projects.length, 2, 'should have two projects')
    t.equal(projects[0].projectId, 'foo', 'should have project id')
    t.end()
  }).catch(t.ifError)
})

test('can request list of projects', t => {
  nock(`https://${apiHost}`)
    .get('/v1/projects')
    .reply(200, [{projectId: 'foo'}, {projectId: 'bar'}])

  const client = sanityClient({useProjectHostname: false, apiHost: `https://${apiHost}`})
  client.projects.list().then(projects => {
    t.equal(projects.length, 2, 'should have two projects')
    t.equal(projects[0].projectId, 'foo', 'should have project id')
    t.end()
  }).catch(t.ifError)
})

/*****************
 * DATASETS      *
 *****************/
test('throws when trying to create dataset with invalid name', t => {
  t.throws(() => getClient().datasets.create('*foo*'), /Datasets can only contain/i)
  t.end()
})

test('throws when trying to delete dataset with invalid name', t => {
  t.throws(() => getClient().datasets.delete('*foo*'), /Datasets can only contain/i)
  t.end()
})

test('can create dataset', t => {
  nock(projectHost()).put('/v1/datasets/bar').reply(200)
  getClient().datasets.create('bar').then(t.end).catch(t.ifError)
})

test('can delete dataset', t => {
  nock(projectHost()).delete('/v1/datasets/bar').reply(200)
  getClient().datasets.delete('bar').then(t.end).catch(t.ifError)
})

/*****************
 * DATA          *
 *****************/
test('can query for documents', t => {
  const query = 'beerfiesta.beer[.title == %beerName]'
  const params = {beerName: 'Headroom Double IPA'}

  nock(projectHost()).post('/v1/data/q/foo', {query, params}).reply(200, {
    ms: 123,
    q: query,
    result: [{$id: 'beerfiesta.beer:njgNkngskjg', rating: 5}]
  })

  getClient().data.fetch(query, params).then(res => {
    t.equal(res.length, 1, 'length should match')
    t.equal(res[0].rating, 5, 'data should match')
    t.end()
  }).catch(t.ifError)
})

test('handles errors gracefully', t => {
  const response = {
    statusCode: 403,
    error: 'Forbidden',
    message: 'You are not allowed to access this resource'
  }

  nock(projectHost()).post('/v1/data/q/foo', {query: 'area51'}).reply(403, response)

  getClient().data.fetch('area51')
    .then(res => t.fail('Resolve handler should not be called on failure'))
    .catch(err => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes(response.error), 'should contain error code')
      t.ok(err.message.includes(response.message), 'should contain error message')
      t.ok(err.responseBody.includes(response.message), 'responseBody should be populated')
      t.end()
    })
})

test('can query for single document', t => {
  const query = '*[.$id == %id]'
  const params = {id: 'foo:123'}

  nock(projectHost()).post('/v1/data/q/foo', {query, params}).reply(200, {
    ms: 123,
    q: query,
    result: [{$id: 'foo:123', mood: 'lax'}]
  })

  getClient().data.getDocument('foo:123').then(res => {
    t.equal(res.mood, 'lax', 'data should match')
    t.end()
  }).catch(t.ifError)
})

test('joins multi-error into one message', t => {
  nock(projectHost()).post('/v1/data/q/foo').reply(400, {
    statusCode: 400,
    errors: [{message: '2 slow'}, {message: '2 placid'}]
  })

  getClient().data.getDocument('foo:123')
    .then(res => t.fail('Resolve handler should not be called on failure'))
    .catch(err => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes('2 slow'), 'should contain first error')
      t.ok(err.message.includes('2 placid'), 'should contain second error')
      t.end()
    })
})

test('gives http statuscode as error if no body is present on >= 400', t => {
  nock(projectHost()).post('/v1/data/q/foo').reply(500)

  getClient().data.getDocument('foo:123')
    .then(res => t.fail('Resolve handler should not be called on failure'))
    .catch(err => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes('HTTP 500'), 'should contain status code')
      t.end()
    })
})

test('populates response body on errors', t => {
  nock(projectHost()).post('/v1/data/q/foo').reply(500, 'Internal Server Error')

  getClient().data.getDocument('foo:123')
    .then(res => t.fail('Resolve handler should not be called on failure'))
    .catch(err => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(err.message.includes('HTTP 500'), 'should contain status code')
      t.ok(err.responseBody.includes('Internal Server Error'), 'body populated')
      t.end()
    })
})

test('rejects if trying to perform data request without dataset', t => {
  sanityClient({projectId: 'foo'}).data.getDocument('foo:123')
    .then(res => t.fail('Resolve handler should not be called on failure'))
    .catch(err => {
      t.ok(err instanceof Error, 'should be error')
      t.ok(/dataset.*?must be provided/.test(err.message))
      t.end()
    })
})

test('can create documents', t => {
  const doc = {$id: 'foo:123', name: 'Raptor'}
  nock(projectHost()).post('/v1/data/m/foo?returnIds=true', {create: doc}).reply(200, {
    transactionId: 'abc123',
    docIds: ['foo:123']
  })

  getClient().data.create(doc)
    .then(res => {
      t.ok(res.transactionId, 'transaction id returned')
      t.equal(res.docIds[0], doc.$id, 'document id returned')
      t.end()
    })
    .catch(t.ifError)
})

test('can create documents without specifying ID', t => {
  const doc = {name: 'Raptor'}
  const expectedBody = {create: Object.assign({}, doc, {$id: 'foo:'})}
  nock(projectHost()).post('/v1/data/m/foo?returnIds=true', expectedBody)
    .reply(200, {
      transactionId: '123abc',
      docIds: ['foo:456']
    })

  getClient().data.create(doc)
    .then(res => {
      t.ok(res.transactionId, 'transaction id returned')
      t.equal(res.docIds[0], 'foo:456', 'document id returned')
      t.end()
    })
    .catch(t.ifError)
})

test('createIfNotExists() sends correct mutation', t => {
  const doc = {$id: 'foo:123', name: 'Raptor'}

  nock(projectHost()).post('/v1/data/m/foo?returnIds=true', {createIfNotExists: doc})
    .reply(200, {transactionId: '123abc', docIds: ['foo:123']})

  getClient().data.createIfNotExists(doc).then(() => t.end()).catch(t.ifError)
})

test('createOrReplace() sends correct mutation', t => {
  const doc = {$id: 'foo:123', name: 'Raptor'}

  nock(projectHost()).post('/v1/data/m/foo?returnIds=true', {createOrReplace: doc})
    .reply(200, {transactionId: '123abc', docIds: ['foo:123']})

  getClient().data.createOrReplace(doc).then(() => t.end()).catch(t.ifError)
})

test('delete() sends correct mutation', t => {
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', {delete: {id: 'foo:123'}})
    .reply(200)

  getClient().data.delete('foo:123').then(() => t.end()).catch(t.ifError)
})

test('mutate() accepts multiple mutations', t => {
  const mutations = [{
    create: {
      $id: 'movie:raiders-of-the-lost-ark',
      title: 'Raiders of the Lost Ark',
      year: 1981
    }
  }, {
    delete: {
      id: 'movie:the-phantom-menace'
    }
  }]

  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', mutations)
    .reply(200)

  getClient().data.mutate(mutations).then(() => t.end()).catch(t.ifError)
})

/*****************
 * PATCH OPS     *
 *****************/
test('can build and serialize a patch of operations', t => {
  const patch = getClient().data.patch('foo:123')
    .inc({count: 1})
    .set({brownEyes: true})
    .serialize()

  t.deepEqual(patch, {id: 'foo:123', inc: {count: 1}, set: {brownEyes: true}})
  t.end()
})

test('merge() patch can be applied multiple times', t => {
  const patch = getClient().data.patch('foo:123')
    .merge({count: 1, foo: 'bar'})
    .merge({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'foo:123', merge: {count: 2, foo: 'bar', bar: 'foo'}})
  t.end()
})

test('setIfMissing() patch can be applied multiple times', t => {
  const patch = getClient().data.patch('foo:123')
    .setIfMissing({count: 1, foo: 'bar'})
    .setIfMissing({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'foo:123', setIfMissing: {count: 2, foo: 'bar', bar: 'foo'}})
  t.end()
})

test('only last replace() patch call gets applied', t => {
  const patch = getClient().data.patch('foo:123')
    .replace({count: 1, foo: 'bar'})
    .replace({count: 2, bar: 'foo'})
    .serialize()

  t.deepEqual(patch, {id: 'foo:123', replace: {count: 2, bar: 'foo'}})
  t.end()
})

test('can apply inc() and dec()', t => {
  const patch = getClient().data.patch('foo:123')
    .inc({count: 1}) // One step forward
    .dec({count: 2}) // Two steps back
    .serialize()

  t.deepEqual(patch, {id: 'foo:123', inc: {count: 1}, dec: {count: 2}})
  t.end()
})

test('all patch methods throw on non-objects being passed as argument', t => {
  const patch = getClient().data.patch('foo:123')
  t.throws(() => patch.merge([]), /merge\(\) takes an object of properties/, 'merge throws')
  t.throws(() => patch.set(null), /set\(\) takes an object of properties/, 'set throws')
  t.throws(() => patch.setIfMissing('foo'), /setIfMissing\(\) takes an object of properties/, 'setIfMissing throws')
  t.throws(() => patch.replace('foo'), /replace\(\) takes an object of properties/, 'replace throws')
  t.throws(() => patch.inc('foo'), /inc\(\) takes an object of properties/, 'inc throws')
  t.throws(() => patch.dec('foo'), /dec\(\) takes an object of properties/, 'dec throws')
  t.end()
})

test('executes patch when commit() is called', t => {
  const expectedPatch = {patch: {id: 'foo:123', inc: {count: 1}, set: {visited: true}}}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', expectedPatch)
    .reply(200, {docIds: ['foo:123']})

  getClient().data.patch('foo:123')
    .inc({count: 1})
    .set({visited: true})
    .commit()
    .then(res => {
      t.equal(res.docIds[0], 'foo:123', 'applies given patch')
      t.end()
    })
    .catch(t.ifError)
})

test('commit() returns promise', t => {
  const expectedPatch = {patch: {id: 'foo:123', inc: {count: 1}, set: {visited: true}}}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', expectedPatch)
    .reply(400)

  getClient().data.patch('foo:123')
    .inc({count: 1})
    .set({visited: true})
    .commit()
    .catch(err => {
      t.ok(err instanceof Error, 'should call applied error handler')
      t.end()
    })
})

test('each patch operation clones patch', t => {
  const patch = getClient().data.patch('foo:123')
  const inc = patch.inc({count: 1})
  const dec = patch.dec({count: 1})
  const combined = inc.dec({count: 1})

  t.notEqual(patch, inc, 'should be cloned')
  t.notEqual(inc, dec, 'should be cloned')
  t.notEqual(inc, combined, 'should be cloned')

  t.deepEqual(patch.serialize(), {id: 'foo:123'}, 'base patch should have only id')
  t.deepEqual(inc.serialize(), {id: 'foo:123', inc: {count: 1}}, 'inc patch should have inc op')
  t.deepEqual(dec.serialize(), {id: 'foo:123', dec: {count: 1}}, 'dec patch should have dec op')
  t.deepEqual(
    combined.serialize(),
    {id: 'foo:123', inc: {count: 1}, dec: {count: 1}},
    'combined patch should have both inc and dec ops'
  )

  t.end()
})

test('can reset patches to no operations, keeping document ID', t => {
  const patch = getClient().data.patch('foo:123').inc({count: 1}).dec({visits: 1})
  const reset = patch.reset()

  t.deepEqual(patch.serialize(), {id: 'foo:123', inc: {count: 1}, dec: {visits: 1}}, 'correct patch')
  t.deepEqual(reset.serialize(), {id: 'foo:123'}, 'reset patch should be empty')
  t.notEqual(patch, reset, 'reset clones, does not mutate')
  t.end()
})

/*****************
 * HTTP REQUESTS *
 *****************/

test('includes token if set', t => {
  const token = 'abcdefghijklmnopqrstuvwxyz'
  const reqheaders = {'Sanity-Token': token}
  nock(projectHost(), {reqheaders})
    .post('/v1/data/q/foo', {query: 'foo.bar'})
    .reply(200, {})

  getClient({token}).data.fetch('foo.bar')
    .then(docs => {
      t.equal(docs.length, 0)
      t.end()
    })
    .catch(t.ifError)
})

test('handles HTTP errors gracefully', t => {
  const doc = {$id: 'foo:bar', visits: 5}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', {create: doc})
    .replyWithError(new Error('Something went wrong'))

  getClient().data.create(doc)
    .then(() => t.fail('Should not call success handler on error'))
    .catch(err => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.message, 'Something went wrong', 'has message')
      t.end()
    })
})

test('handles response timeouts gracefully', t => {
  const doc = {$id: 'foo:bar', visits: 5}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', {create: doc})
    .delay(300)
    .reply(200)

  getClient({timeout: 150}).data.create(doc)
    .then(() => t.fail('Should not call success handler on timeouts'))
    .catch(err => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.code, 'ETIMEDOUT', 'should have timeout error code')
      t.end()
    })
})

test('handles connection timeouts gracefully', t => {
  const doc = {$id: 'foo:bar', visits: 5}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', {create: doc})
    .delayConnection(300)
    .reply(200)

  getClient({timeout: 150}).data.create(doc)
    .then(() => t.fail('Should not call success handler on timeouts'))
    .catch(err => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.code, 'ETIMEDOUT', 'should have timeout error code')
      t.end()
    })
})

test('handles socket timeouts gracefully', t => {
  const doc = {$id: 'foo:bar', visits: 5}
  nock(projectHost())
    .post('/v1/data/m/foo?returnIds=true', {create: doc})
    .socketDelay(300)
    .reply(200)

  getClient({timeout: 150}).data.create(doc)
    .then(() => t.fail('Should not call success handler on timeouts'))
    .catch(err => {
      t.ok(err instanceof Error, 'should error')
      t.equal(err.code, 'ESOCKETTIMEDOUT', 'should have timeout error code')
      t.end()
    })
})
