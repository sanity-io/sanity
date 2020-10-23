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
  ['fourty-two', ['fourty', 'two']],
  ['abc -23 def', ['abc', '23', 'def']],
]

tests.forEach(([input, expected]) => {
  test('tokenization of search input string', () => {
    expect(tokenize(input)).toEqual(expected)
  })
})
