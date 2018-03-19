/* eslint-disable strict */
// (Node 4 compat)

'use strict'

const test = require('tape')
const nock = require('nock')
const assign = require('xtend')
const sanityClient = require('../src/sanityClient')
const sseServer = require('./helpers/sseServer')

const apiHost = 'https://api.sanity.url'
const clientConfig = {apiHost: apiHost, namespace: 'beerns', gradientMode: true}
const getClient = conf => sanityClient(assign({}, clientConfig, conf || {}))

/*****************
 * GRADIENT MODE *
 *****************/
test('[gradient] throws when creating client without specifying namespace', t => {
  t.throws(
    () => sanityClient({gradientMode: true}),
    /must contain `namespace`/,
    'throws on create()'
  )
  t.end()
})

test('[gradient] can query for documents', t => {
  const query = '*[is "beerfiesta.beer" && title == $beerName]'
  const params = {beerName: 'Headroom Double IPA'}
  const qs =
    '*%5Bis%20%22beerfiesta.beer%22%20%26%26%20title%20%3D%3D%20%24beerName%5D&%24beerName=%22Headroom%20Double%20IPA%22'

  nock(apiHost)
    .get(`/query/beerns?query=${qs}`)
    .reply(200, {
      ms: 123,
      q: query,
      result: [{_id: 'njgNkngskjg', _type: 'beerfiesta.beer', rating: 5}]
    })

  getClient()
    .fetch(query, params)
    .then(res => {
      t.equal(res.length, 1, 'length should match')
      t.equal(res[0].rating, 5, 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('[gradient] can query for single document', t => {
  nock(apiHost)
    .get('/doc/beerns/njgNkngskjg')
    .reply(200, {
      ms: 123,
      documents: [{_id: 'njgNkngskjg', title: 'Headroom Double IPA'}]
    })

  getClient()
    .getDocument('njgNkngskjg')
    .then(res => {
      t.equal(res.title, 'Headroom Double IPA', 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('[gradient] can query for single document with token', t => {
  const reqheaders = {Authorization: 'Bearer MyToken'}
  nock(apiHost, {reqheaders})
    .get('/doc/beerns/barfoo')
    .reply(200, {
      ms: 123,
      documents: [{_id: 'barfoo', mood: 'lax'}]
    })

  getClient({token: 'MyToken'})
    .getDocument('barfoo')
    .then(res => {
      t.equal(res.mood, 'lax', 'data should match')
    })
    .catch(t.ifError)
    .then(t.end)
})

test('[gradient] can listen in gradient mode', t => {
  function onRequest(opts) {
    t.equal(opts.request.headers.authorization, 'Bearer FooToken', 'should have correct token')
    opts.channel.send({event: 'mutation', data: {abc: 123}})
    process.nextTick(() => opts.channel.close())
  }

  sseServer(onRequest, (err, server) => {
    if (err) {
      t.end(err)
      return
    }

    const client = getClient({
      apiHost: `http://localhost:${server.address().port}`,
      token: 'FooToken'
    })

    const subscription = client.listen('*').subscribe(msg => {
      t.deepEqual(msg, {type: 'mutation', abc: 123}, 'should have correct data')
      subscription.unsubscribe()
      server.close()
      t.end()
    })
  })
})
