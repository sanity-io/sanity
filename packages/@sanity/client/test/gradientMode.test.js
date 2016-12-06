/* eslint-disable strict */
// (Node 4 compat)

'use strict'

const test = require('tape')
const nock = require('nock')
const assign = require('xtend')
const sanityClient = require('../src/sanityClient')

const apiHost = 'https://api.sanity.url'
const clientConfig = {apiHost: apiHost, projectId: 'bf1942', dataset: 'foo', gradientMode: true}
const getClient = conf => sanityClient(assign({}, clientConfig, conf || {}))

/*****************
 * GRADIENT MODE *
 *****************/
test('[gradient] can query for documents', t => {
  const query = 'beerfiesta.beer[.title == $beerName]'
  const params = {beerName: 'Headroom Double IPA'}
  const qs = 'beerfiesta.beer%5B.title%20%3D%3D%20%24beerName%5D&%24beerName=%22Headroom%20Double%20IPA%22'

  nock(apiHost).get(`/query/bf1942/foo?query=${qs}`).reply(200, {
    ms: 123,
    q: query,
    result: [{_id: 'beerfiesta.beer:njgNkngskjg', rating: 5}]
  })

  getClient().fetch(query, params).then(res => {
    t.equal(res.length, 1, 'length should match')
    t.equal(res[0].rating, 5, 'data should match')
  }).catch(t.ifError).then(t.end)
})

test('[gradient] can query for single document', t => {
  nock(apiHost).get('/doc/bf1942/foo/123').reply(200, {
    ms: 123,
    documents: [{_id: 'foo/123', mood: 'lax'}]
  })

  getClient().getDocument('foo/123').then(res => {
    t.equal(res.mood, 'lax', 'data should match')
  }).catch(t.ifError).then(t.end)
})

test('[gradient] can query for single document with token', t => {
  const reqheaders = {Authorization: 'Bearer MyToken'}
  nock(apiHost, {reqheaders}).get('/doc/bf1942/foo/123').reply(200, {
    ms: 123,
    documents: [{_id: 'foo/123', mood: 'lax'}]
  })

  getClient({token: 'MyToken'}).getDocument('foo/123').then(res => {
    t.equal(res.mood, 'lax', 'data should match')
  }).catch(t.ifError).then(t.end)
})
