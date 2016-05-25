import nock from 'nock'
import test from 'ava'
import sanityClient from '../src/client'

const baseUrl = 'https://gradient.url'
const client = sanityClient({url: baseUrl, dataset: 'foo'})

test('can do simple requests', t => {
  nock(baseUrl).post('/q/foo', {query: 'query'}).reply(200, {
    ms: 123,
    result: [{foo: 'bar'}, {bar: 'foo'}]
  })
  return client.fetch('query').then(res => {
    t.is(res[0].foo, 'bar')
    t.is(res[1].bar, 'foo')
  })
})

test('can do update mutations', t => {
  const patch = {
    merge: {
      attributes: {
        description: 'Blah'
      }
    }
  }

  nock(baseUrl)
    .post('/m/foo?returnIds=true', [{update: {id: 'foo:raptor', patch}}])
    .reply(200, {})

  return client.update('foo:raptor', patch)
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
