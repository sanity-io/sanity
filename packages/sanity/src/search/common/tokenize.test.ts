import {tokenize} from './tokenize'

const tests = [
  {input: '', expected: []},
  {input: 'foo', expected: ['foo']},
  {input: '0foo', expected: ['0foo']},
  {input: 'a16z', expected: ['a16z']},
  {input: 'foo,,, ,    ,foo,bar', expected: ['foo', 'foo', 'bar']},
  {input: 'pho-bar, foo-bar', expected: ['pho', 'bar', 'foo', 'bar']},
  {input: '0 foo', expected: ['0', 'foo']},
  {input: 'foo 🤪🤪🤪', expected: ['foo', '🤪🤪🤪']},
  {input: 'foo 🤪🤪🤪 bar', expected: ['foo', '🤪🤪🤪', 'bar']},
  {input: '1 2 3', expected: ['1', '2', '3']},
  {input: 'foo, bar, baz', expected: ['foo', 'bar', 'baz']},
  {input: 'foo   , bar   , baz', expected: ['foo', 'bar', 'baz']},
  {input: 'a.b.c', expected: ['a.b.c']},
  {input: 'sanity.io', expected: ['sanity.io']},
  {input: 'fourty-two', expected: ['fourty', 'two']},
  {input: 'full stop. Then new beginning', expected: ['full', 'stop', 'Then', 'new', 'beginning']},
  {input: 'about .io domains', expected: ['about', 'io', 'domains']},
  {input: 'abc -23 def', expected: ['abc', '23', 'def']},
  {input: 'banana&[friends]\\/ barnåler', expected: ['banana', 'friends', 'barnåler']},
  {input: 'banana&friends barnåler', expected: ['banana', 'friends', 'barnåler']},
  {input: 'ban*ana*', expected: ['ban', 'ana']},
  {
    input: '한국인은 banana 동의하지 않는다',
    expected: ['한국인은', 'banana', '동의하지', '않는다'],
  },
  {input: '한국인은    동의2하지', expected: ['한국인은', '동의2하지']},
]

tests.forEach(({input, expected}) => {
  test('tokenization of search input string', () => {
    expect(tokenize(input)).toEqual(expected)
  })
})
