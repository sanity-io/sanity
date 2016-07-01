import nock from 'nock'
import test from 'ava'
import sanityClient from '../src/client'

const baseUrl = 'https://gradient.url'
const client = sanityClient({url: baseUrl, dataset: 'foo'})

test('can get and set config', t => {
  nock(baseUrl).post('/q/foo', {query: 'query'}).reply(200, {ms: 123, result: []})
  nock(baseUrl).post('/q/bar', {query: 'query'}).reply(200, {ms: 456, result: []})

  return client.fetch('query')
    .then(res => t.is(res.ms, 123))
    .then(() =>
      client
        .config({dataset: 'bar'})
        .fetch('query')
        .then(res => t.is(res.ms, 456)))
})

test('can do simple requests', t => {
  nock(baseUrl)
    .post('/q/foo', {query: 'query'})
    .reply(200, {
      ms: 123,
      result: [{foo: 'bar'}, {bar: 'foo'}]
    })

  return client.fetch('query').then(res => {
    t.is(res.result[0].foo, 'bar')
    t.is(res.result[1].bar, 'foo')
  })
})

test('can do update mutations', t => {
  const patch = {description: 'foo'}

  nock(baseUrl)
    .post('/m/foo?returnIds=true', {'foo:raptor': {$$update: patch}})
    .reply(200, {})

  return client.update('foo:raptor', patch)
})

test('can create something', t => {
  const doc = {title: 'Baloney'}

  nock(baseUrl)
    .post('/m/foo?returnIds=true', {'foo:': {$$create: doc}})
    .reply(201, {ms: 123, transactionId: 'bar', docIds: ['foo:99']})

  return client.create(doc).then(res => {
    t.is(res.transactionId, 'bar')
    t.is(res.docIds[0], 'foo:99')
  })
})

test('can delete', t => {
  nock(baseUrl)
    .post('/m/foo?returnIds=true', {foo: {$$delete: null}})
    .reply(200, {ms: 123, transactionId: 'bar'})

  return client.delete('foo').then(res => {
    t.is(res.transactionId, 'bar')
  })
})

test('request errors are captured as errors', t => {
  nock(baseUrl)
    .post('/q/foo', {query: 'some invalid query'})
    .reply(400, {errors: [{message: 'Some error', line: 1, column: 13}]})

  return t.throws(
    client.fetch('some invalid query'),
    /Some error/
  )
})
