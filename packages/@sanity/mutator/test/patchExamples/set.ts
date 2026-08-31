import {type PatchExample} from './types'

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
    name: 'Set new deep key',
    before: {},
    patch: {
      id: 'a',
      set: {
        'a.b.c': 'hello',
      },
    },
    after: {
      a: {
        b: {
          c: 'hello',
        },
      },
    },
  },
  {
    name: 'Set deep key on previous string value',
    before: {
      a: 'stringValue',
    },
    patch: {
      id: 'a',
      set: {
        'a.b.c': 'hello',
      },
    },
    after: {
      a: {
        b: {
          c: 'hello',
        },
      },
    },
  },
  {
    name: 'Set deep key on previous number value',
    before: {
      a: 123,
    },
    patch: {
      id: 'a',
      set: {
        'a.b.c': 'hello',
      },
    },
    after: {
      a: {
        b: {
          c: 'hello',
        },
      },
    },
  },
  {
    name: 'Set key on previous number value',
    before: {
      a: 123,
    },
    patch: {
      id: 'a',
      set: {
        'a.b': 'hello',
      },
    },
    after: {
      a: {
        b: 'hello',
      },
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
  {
    name: 'Set descending past an out-of-range array index',
    before: {
      body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'hello'}]}],
    },
    patch: {
      id: 'a',
      set: {
        'body[4].children[0].text': 'x',
      },
    },
    after: {
      body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'hello'}]}],
    },
  },
  {
    name: 'Set descending an index into a non-array',
    before: {
      a: 'string',
    },
    patch: {
      id: 'a',
      set: {
        'a[0].b': 1,
      },
    },
    after: {
      a: 'string',
    },
  },
  {
    name: 'Set at an out-of-range array index',
    before: {
      body: [
        {_key: 'a', _type: 'block'},
        {_key: 'b', _type: 'block'},
      ],
    },
    patch: {
      id: 'a',
      set: {
        'body[5]': {_key: 'z', _type: 'block'},
      },
    },
    after: {
      body: [
        {_key: 'a', _type: 'block'},
        {_key: 'b', _type: 'block'},
      ],
    },
  },
  {
    name: 'Set at exactly the array length appends',
    before: {
      a: [1, 2],
    },
    patch: {
      id: 'a',
      set: {
        'a[2]': 3,
      },
    },
    after: {
      a: [1, 2, 3],
    },
  },
  {
    name: 'Set at a negative index resolving out of range',
    before: {
      a: [1, 2],
    },
    patch: {
      id: 'a',
      set: {
        'a[-5]': 9,
      },
    },
    after: {
      a: [1, 2],
    },
  },
  {
    name: 'Set at an index of a non-array',
    before: {
      a: 'string',
    },
    patch: {
      id: 'a',
      set: {
        'a[0]': 1,
      },
    },
    after: {
      a: 'string',
    },
  },
  {
    name: 'Set descending through a negative index',
    before: {
      a: [{b: 1}],
    },
    patch: {
      id: 'a',
      set: {
        'a[-1].b': 9,
      },
    },
    after: {
      a: [{b: 9}],
    },
  },
  {
    name: 'Set descending through an open-ended range',
    before: {
      a: [{b: 1}],
    },
    patch: {
      id: 'a',
      set: {
        'a[0:].b': 9,
      },
    },
    after: {
      a: [{b: 9}],
    },
  },
]

export default examples
