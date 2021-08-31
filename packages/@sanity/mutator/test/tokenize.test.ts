import tokenize from '../src/jsonpath/tokenize'

const cases = {
  'a.b[7]': [
    {
      type: 'identifier',
      name: 'a',
    },
    {
      type: 'operator',
      symbol: '.',
    },
    {
      type: 'identifier',
      name: 'b',
    },
    {
      type: 'paren',
      symbol: '[',
    },
    {
      type: 'number',
      value: 7,
      raw: '7',
    },
    {
      type: 'paren',
      symbol: ']',
    },
  ],
  '-1': [
    {
      type: 'number',
      value: -1,
      raw: '-1',
    },
  ],
  'some.array[@ == "snafu"]': [
    {
      type: 'identifier',
      name: 'some',
    },
    {
      type: 'operator',
      symbol: '.',
    },
    {
      type: 'identifier',
      name: 'array',
    },
    {
      type: 'paren',
      symbol: '[',
    },
    {
      type: 'keyword',
      symbol: '@',
    },
    {
      type: 'comparator',
      symbol: '==',
    },
    {
      type: 'quoted',
      value: 'snafu',
      quote: 'double',
    },
    {
      type: 'paren',
      symbol: ']',
    },
  ],
  '..[key == "e7rw"]': [
    {
      type: 'operator',
      symbol: '..',
    },
    {
      type: 'paren',
      symbol: '[',
    },
    {
      type: 'identifier',
      name: 'key',
    },
    {
      type: 'comparator',
      symbol: '==',
    },
    {
      type: 'quoted',
      value: 'e7rw',
      quote: 'double',
    },
    {
      type: 'paren',
      symbol: ']',
    },
  ],
  '"\\"quoted\\""': [
    {
      type: 'quoted',
      value: '"quoted"',
      quote: 'double',
    },
  ],
  '[true, false]': [
    {
      symbol: '[',
      type: 'paren',
    },
    {
      symbol: 'true',
      type: 'boolean',
    },
    {
      symbol: ',',
      type: 'operator',
    },
    {
      symbol: 'false',
      type: 'boolean',
    },
    {
      symbol: ']',
      type: 'paren',
    },
  ],
}

test('Tokenization of jsonpath', () => {
  Object.keys(cases).forEach((path) => {
    const expected = cases[path]
    if (!expected) {
      // eslint-disable-next-line no-console
      console.log(`Result of tokenizing '${path}'`, tokenize(path))
    }
    expect(tokenize(path)).toEqual(expected) // `Tokenization failed for '${path
  })
})
