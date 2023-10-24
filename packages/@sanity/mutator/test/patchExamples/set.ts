import type {PatchExample} from './types'

const examples: PatchExample[] = [
  {
    name: 'Simple path set',
    before: {
      a: {
        b: 7,
      },
    },
    patch: {
      id: 'a',
      set: {
        'a.b': 10,
      },
    },
    after: {
      a: {
        b: 10,
      },
    },
  },
  {
    name: 'Array union set',
    before: {
      a: {
        b: [0, 10, 20],
      },
    },
    patch: {
      id: 'a',
      set: {
        'a.b[0,2]': 10,
      },
    },
    after: {
      a: {
        b: [10, 10, 10],
      },
    },
  },
  {
    name: 'Array constraint set',
    before: {
      a: {
        b: [0, 10, 20],
      },
    },
    patch: {
      id: 'a',
      set: {
        'a.b[@ < 20]': 10,
      },
    },
    after: {
      a: {
        b: [10, 10, 20],
      },
    },
  },
  {
    name: 'Deep branch',
    before: {
      a: {
        b: [0, 10, {c: 52}],
        d: 12,
      },
    },
    patch: {
      id: 'a',
      set: {
        'a[b[2].c,d]': 'Hello',
      },
    },
    after: {
      a: {
        b: [0, 10, {c: 'Hello'}],
        d: 'Hello',
      },
    },
  },
  {
    name: 'Attribute filter',
    before: {
      animals: [
        {
          name: 'cat',
          cute: true,
        },
        {
          name: 'jumping spider',
          cute: false,
        },
      ],
    },
    patch: {
      id: 'a',
      set: {
        'animals[name=="jumping spider"].cute': true,
      },
    },
    after: {
      animals: [
        {
          name: 'cat',
          cute: true,
        },
        {
          name: 'jumping spider',
          cute: true,
        },
      ],
    },
  },
  {
    name: 'Attribute greater than or equal filter',
    before: {
      variants: [
        {name: 'a', stock: 20},
        {name: 'b', stock: 30},
        {name: 'c', stock: 10},
      ],
    },
    patch: {
      id: 'a',
      set: {
        'variants[stock >= 20].stock': 5,
      },
    },
    after: {
      variants: [
        {name: 'a', stock: 5},
        {name: 'b', stock: 5},
        {name: 'c', stock: 10},
      ],
    },
  },
  {
    name: 'Attribute less than or equal filter',
    before: {
      variants: [
        {name: 'x', stock: 99},
        {name: 'y', stock: 50},
        {name: 'z', stock: 10},
      ],
    },
    patch: {
      id: 'a',
      set: {
        'variants[stock <= 50].stock': 5,
      },
    },
    after: {
      variants: [
        {name: 'x', stock: 99},
        {name: 'y', stock: 5},
        {name: 'z', stock: 5},
      ],
    },
  },
  {
    name: 'Set new key',
    before: {},
    patch: {
      id: 'a',
      set: {
        a: 'hello',
      },
    },
    after: {
      a: 'hello',
    },
  },
  {
    name: 'Set range',
    before: {
      a: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    patch: {
      id: 'a',
      set: {
        'a[4:]': -1,
      },
    },
    after: {
      a: [0, 1, 2, 3, -1, -1, -1, -1],
    },
  },
  {
    name: 'Recursive',
    before: {
      a: [{deep: 'Hello', b: {deep: false}}],
      deep: 12.3,
    },
    patch: {
      id: 'a',
      set: {
        'a..deep': 'How deep?',
      },
    },
    after: {
      a: [{deep: 'How deep?', b: {deep: 'How deep?'}}],
      deep: 12.3,
    },
  },
  {
    name: 'Recursive constraint',
    before: {
      a: [{deep: 'Hello', b: {deep: 'banana'}}],
      deep: 12.3,
    },
    patch: {
      id: 'a',
      set: {
        'a..[deep == "banana"].fnah': 'How deep?',
      },
    },
    after: {
      a: [{deep: 'Hello', b: {deep: 'banana', fnah: 'How deep?'}}],
      deep: 12.3,
    },
  },
  {
    name: 'Array of patches',
    before: {
      a: 0,
    },
    patch: [
      {id: 'a', inc: {a: 1}},
      {id: 'a', inc: {a: 2}},
    ],
    after: {
      a: 3,
    },
  },
]

export default examples
