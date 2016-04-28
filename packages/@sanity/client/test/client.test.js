import nock from 'nock'
import test from 'ava'
import sanityClient from '../src/client'

const baseUrl = 'https://gradient.url'
const client = sanityClient({url: baseUrl, dataset: 'foo'})

test('can do simple requests', t => {
  nock(baseUrl).post('/q/foo', {query: 'query'}).reply(200, {})
  return client.fetch('query')
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
