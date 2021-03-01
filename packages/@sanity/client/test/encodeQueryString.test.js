const test = require('tape')
const encode = require('../src/data/encodeQueryString')

test('can encode basic query without parameters', (t) => {
  const query = 'gamedb.game[maxPlayers == 64]'
  t.equal(encode({query}), '?query=gamedb.game%5BmaxPlayers%20%3D%3D%2064%5D')
  t.end()
})

test('can encode queries with basic numeric parameters', (t) => {
  const query = 'gamedb.game[maxPlayers == $maxPlayers && score == $score]'
  t.equal(
    encode({query, params: {maxPlayers: 64, score: 3.45678}}),
    '?query=gamedb.game%5BmaxPlayers%20%3D%3D%20%24maxPlayers%20%26%26%20score%20%3D%3D%20%24score%5D' +
      '&%24maxPlayers=64&%24score=3.45678'
  )
  t.end()
})

test('can encode queries with basic string parameters', (t) => {
  const query = 'gamedb.game[name == $name]'
  t.equal(
    encode({query, params: {name: 'foobar'}}),
    '?query=gamedb.game%5Bname%20%3D%3D%20%24name%5D&%24name=%22foobar%22'
  )
  t.end()
})

test('can encode queries with booleans', (t) => {
  const query = 'gamedb.game[isReleased == $released]'
  t.equal(
    encode({query, params: {released: true}}),
    '?query=gamedb.game%5BisReleased%20%3D%3D%20%24released%5D&%24released=true'
  )
  t.end()
})
