import parse from '../src/jsonpath/parse'

const cases = {
  a: {
    type: 'attribute',
    name: 'a',
  },
  'a.b': {
    type: 'path',
    nodes: [
      {
        type: 'attribute',
        name: 'a',
      },
      {
        type: 'attribute',
        name: 'b',
      },
    ],
  },
  '[7]': {
    type: 'union',
    nodes: [
      {
        type: 'index',
        value: 7,
      },
    ],
  },
  '[-4]': {
    type: 'union',
    nodes: [
      {
        type: 'index',
        value: -4,
      },
    ],
  },
  'a.b[7]': {
    type: 'path',
    nodes: [
      {
        type: 'attribute',
        name: 'a',
      },
      {
        type: 'attribute',
        name: 'b',
      },
      {
        type: 'union',
        nodes: [
          {
            type: 'index',
            value: 7,
          },
        ],
      },
    ],
  },
  'some.array[@ == "snafu"]': {
    type: 'path',
    nodes: [
      {
        type: 'attribute',
        name: 'some',
      },
      {
        type: 'attribute',
        name: 'array',
      },
      {
        type: 'union',
        nodes: [
          {
            type: 'constraint',
            operator: '==',
            lhs: {
              type: 'alias',
              target: 'self',
            },
            rhs: {
              type: 'string',
              value: 'snafu',
            },
          },
        ],
      },
    ],
  },
  '[count > 5]': {
    type: 'union',
    nodes: [
      {
        type: 'constraint',
        operator: '>',
        lhs: {
          type: 'attribute',
          name: 'count',
        },
        rhs: {
          type: 'number',
          value: 5,
        },
      },
    ],
  },
  '..a': {
    type: 'recursive',
    term: {
      type: 'attribute',
      name: 'a',
    },
  },
  '[]': {
    type: 'union',
    nodes: [],
  },
  '[0,1]._weak': {
    type: 'path',
    nodes: [
      {
        type: 'union',
        nodes: [
          {
            type: 'index',
            value: 0,
          },
          {
            type: 'index',
            value: 1,
          },
        ],
      },
      {
        type: 'attribute',
        name: '_weak',
      },
    ],
  },
  '[_ref?]': {
    nodes: [
      {
        lhs: {
          name: '_ref',
          type: 'attribute',
        },
        operator: '?',
        type: 'constraint',
      },
    ],
    type: 'union',
  },
}

Object.keys(cases).forEach((path) => {
  test(`Parsing jsonpath ${path}`, () => {
    const expected = cases[path]
    if (expected) {
      expect(parse(path)).toEqual(expected)
    } else {
      // eslint-disable-next-line no-console
      console.log(`Result of parsing '${path}'`, JSON.stringify(parse(path)))
    }
  })
})
