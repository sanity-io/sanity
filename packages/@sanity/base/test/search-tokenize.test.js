import {tokenize} from '../src/search/common/tokenize'

const tests = [
  ['', []],
  ['foo', ['foo']],
  ['0foo', ['0foo']],
  ['a16z', ['a16z']],
  ['foo,,, ,    ,foo,bar', ['foo', 'foo', 'bar']],
  ['pho-bar, foo-bar', ['pho', 'bar', 'foo', 'bar']],
  ['0 foo', ['0', 'foo']],
  ['foo 🤪🤪🤪', ['foo', '🤪🤪🤪']],
  ['foo 🤪🤪🤪 bar', ['foo', '🤪🤪🤪', 'bar']],
  ['1 2 3', ['1', '2', '3']],
  ['foo, bar, baz', ['foo', 'bar', 'baz']],
  ['foo   , bar   , baz', ['foo', 'bar', 'baz']],
  ['a.b.c', ['a.b.c']],
  ['sanity.io', ['sanity.io']],
  ['fourty-two', ['fourty', 'two']],
  ['full stop. Then new beginning', ['full', 'stop', 'Then', 'new', 'beginning']],
  ['about .io domains', ['about', 'io', 'domains']],
  ['abc -23 def', ['abc', '23', 'def']],
  ['banana&[friends]\\/ barnåler', ['banana', 'friends', 'barnåler']],
  ['banana&friends barnåler', ['banana', 'friends', 'barnåler']],
  ['ban*ana*', ['ban', 'ana']],
  ['한국인은 banana 동의하지 않는다', ['한국인은', 'banana', '동의하지', '않는다']],
  ['한국인은    동의2하지', ['한국인은', '동의2하지']],
]

tests.forEach(([input, expected]) => {
  test('tokenization of search input string', () => {
    expect(tokenize(input)).toEqual(expected)
  })
})
