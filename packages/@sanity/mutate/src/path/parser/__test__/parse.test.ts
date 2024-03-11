import {test} from 'vitest'

import {type ParseError, type StringToPath} from '../types'

// Asserts that type A is assignable to B
function assertAssignable<A extends B, B>() {}

test('it parses plain field accessors', () => {
  assertAssignable<StringToPath<'[foo=="bar"]'>, [{foo: 'bar'}]>()
  assertAssignable<StringToPath<'field[foo=="bar"]'>, ['field', {foo: 'bar'}]>()
  assertAssignable<
    StringToPath<'field[foo=="bar"][a=="b"]'>,
    ['field', {foo: 'bar'}, {a: 'b'}]
  >()

  assertAssignable<
    StringToPath<'field[foo=="bar"].hi[2]'>,
    ['field', {foo: 'bar'}, 'hi', 2]
  >()

  assertAssignable<
    StringToPath<'field[foo=="bar"][a=="b"].lol[3]'>,
    ['field', {foo: 'bar'}, {a: 'b'}, 'lol', 3]
  >()

  // Invalid index
  assertAssignable<StringToPath<'[z2]'>, ParseError<string>>()

  assertAssignable<
    StringToPath<'field[foo=="bar"][a=="b"].prop[-3]'>,
    ['field', {foo: 'bar'}, {a: 'b'}, 'prop', -3]
  >()

  assertAssignable<
    StringToPath<'.field[foo=="bar"][a=="b"].lol[3]'>,
    ParseError<string>
  >()

  assertAssignable<StringToPath<'foo'>, ['foo']>()

  assertAssignable<StringToPath<'foo.'>, ParseError<string>>()
  assertAssignable<StringToPath<'.foo'>, ParseError<string>>()

  assertAssignable<['foo', 'bar'], StringToPath<'foo.bar'>>()

  assertAssignable<StringToPath<'[_key=="foo"]'>, [{_key: 'foo'}]>()

  assertAssignable<StringToPath<'[_key == "foo"][22]'>, [{_key: 'foo'}, 22]>()

  assertAssignable<StringToPath<'[_key == "foo"][200]'>, [{_key: 'foo'}, 200]>()

  // whitespace trimmed
  assertAssignable<
    StringToPath<'  lol    [   _key == "foo"  ][ 22  ].first'>,
    ['lol', {_key: 'foo'}, 22, 'first']
  >()
  assertAssignable<
    StringToPath<'  lol    [   _key == "foo"  ][ 22  ].first'>,
    ['lol', {_key: 'foo'}, 22, 'first']
  >()
})
