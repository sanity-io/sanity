import type {PatchExample} from './types'

const examples: PatchExample[] = [
  {
    name: 'Mix `setIfMissing` and `set`',
    before: {
      a: {},
    },
    patch: {
      id: 'a',
      setIfMissing: {
        'a.b': 10,
      },
      set: {
        'a.b': 20,
      },
    },
    after: {
      a: {
        b: 20,
      },
    },
  },
  {
    name: 'Mix `setIfMissing` and `set` (different attributes)',
    before: {
      a: {},
    },
    patch: {
      id: 'a',
      setIfMissing: {
        'a._type': 'object',
        'a.b': {_type: 'object'},
      },
      set: {
        'a.b.c': 'hello',
      },
    },
    after: {
      a: {
        _type: 'object',
        b: {
          _type: 'object',
          c: 'hello',
        },
      },
    },
  },
]

export default examples
