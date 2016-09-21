const test = require('tape')
const encode = require('../src/data/encodeQueryString')

test('throws if parameters contain "query"', t => {
  t.throws(() => encode({
    query: 'gamedb.game[.some == %query]',
    params: {query: 'foo'}
  }), /query.*?reserved/)
  t.end()
})

test('can encode basic query without parameters', t => {
  const query = 'gamedb.game[.maxPlayers == 64]'
  t.equal(encode({query}), '?query=gamedb.game%5B.maxPlayers%20%3D%3D%2064%5D')
  t.end()
})

test('can encode queries with basic numeric parameters', t => {
  const query = 'gamedb.game[.maxPlayers == %maxPlayers && .score == %score]'
  t.equal(
    encode({query, params: {maxPlayers: 64, score: 3.45678}}),
    '?query=gamedb.game%5B.maxPlayers%20%3D%3D%20%25maxPlayers%20%26%26%20.score%20%3D%3D%20%25score%5D'
    + '&maxPlayers=64&score=3.45678'
  )
  t.end()
})

test('can encode queries with basic string parameters', t => {
  const query = 'gamedb.game[.name == %name]'
  t.equal(
    encode({query, params: {name: 'foobar'}}),
    '?query=gamedb.game%5B.name%20%3D%3D%20%25name%5D&name=%22foobar%22'
  )
  t.end()
})

test('can encode queries with booleans', t => {
  const query = 'gamedb.game[.isReleased == %released]'
  t.equal(
    encode({query, params: {released: true}}),
    '?query=gamedb.game%5B.isReleased%20%3D%3D%20%25released%5D&released=true'
  )
  t.end()
})
