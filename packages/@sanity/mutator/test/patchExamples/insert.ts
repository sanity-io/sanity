import {type PatchExample} from './types'

const examples: PatchExample[] = [
  {
    name: 'Insert before index',
    before: {
      a: [0, 1, 2, 3, 4],
    },
    patch: {
      id: 'a',
      insert: {
        before: 'a[2]',
        items: [-1, -2],
      },
    },
    after: {
      a: [0, 1, -1, -2, 2, 3, 4],
    },
  },
  {
    name: 'Insert after index',
    before: {
      a: [0, 1, 2, 3, 4],
    },
    patch: {
      id: 'a',
      insert: {
        after: 'a[2]',
        items: [-1, -2],
      },
    },
    after: {
      a: [0, 1, 2, -1, -2, 3, 4],
    },
  },
  {
    name: 'Insert after empty',
    before: {
      a: [],
    },
    patch: {
      id: 'a',
      insert: {
        after: 'a[-1]',
        items: [-1, -2],
      },
    },
    after: {
      a: [-1, -2],
    },
  },
  {
    name: 'Insert object in array',
    before: {
      addresses: [{address: 'Mogata 24'}],
    },
    patch: {
      id: 'a',
      insert: {
        after: 'addresses[-1]',
        items: [{address: '123 Banana Rd.'}],
      },
    },
    after: {
      addresses: [{address: 'Mogata 24'}, {address: '123 Banana Rd.'}],
    },
  },
  {
    name: 'Replace items in array',
    before: {
      scores: [1, 2, 3, 4, 5],
    },
    patch: {
      id: 'a',
      insert: {
        replace: 'scores[1:4]',
        items: ['hello', 'man'],
      },
    },
    after: {
      scores: [1, 'hello', 'man', 5],
    },
  },
  {
    name: 'Replace single item in array',
    before: {
      scores: [1, 2, 3, 4, 5],
    },
    patch: {
      id: 'a',
      insert: {
        replace: 'scores[1]',
        items: [9],
      },
    },
    after: {
      scores: [1, 9, 3, 4, 5],
    },
  },
  {
    name: 'Replace single object in array',
    before: {
      scores: [{a: 1}, {a: 2}, {a: 3}],
    },
    patch: {
      id: 'a',
      insert: {
        replace: 'scores[1]',
        items: [{a: 'hello'}],
      },
    },
    after: {
      scores: [{a: 1}, {a: 'hello'}, {a: 3}],
    },
  },
  {
    name: 'Replace array item by nested attribute constraint',
    before: {
      array: [
        {asset: {_ref: 'image-1'}, label: 'old'},
        {asset: {_ref: 'image-2'}, label: 'keep'},
      ],
    },
    patch: {
      id: 'a',
      insert: {
        replace: 'array[asset._ref == "image-1"]',
        items: [{asset: {_ref: 'image-1'}, label: 'new'}],
      },
    },
    after: {
      array: [{asset: {_ref: 'image-1'}, label: 'new'}, {asset: {_ref: 'image-2'}, label: 'keep'}],
    },
  },
  {
    name: 'Insert after array item matched by nested attribute constraint',
    before: {
      array: [
        {asset: {_ref: 'image-1'}, label: 'first'},
        {asset: {_ref: 'image-2'}, label: 'second'},
      ],
    },
    patch: {
      id: 'a',
      insert: {
        after: 'array[asset._ref == "image-1"]',
        items: [{asset: {_ref: 'image-3'}, label: 'inserted'}],
      },
    },
    after: {
      array: [
        {asset: {_ref: 'image-1'}, label: 'first'},
        {asset: {_ref: 'image-3'}, label: 'inserted'},
        {asset: {_ref: 'image-2'}, label: 'second'},
      ],
    },
  },
  {
    name: 'Replace with nested attribute constraint that matches nothing is a no-op',
    before: {
      array: [
        {asset: {_ref: 'image-1'}, label: 'first'},
        {asset: {_ref: 'image-2'}, label: 'second'},
      ],
    },
    patch: {
      id: 'a',
      insert: {
        replace: 'array[asset._ref == "missing"]',
        items: [{asset: {_ref: 'image-9'}, label: 'should not appear'}],
      },
    },
    after: {
      array: [
        {asset: {_ref: 'image-1'}, label: 'first'},
        {asset: {_ref: 'image-2'}, label: 'second'},
      ],
    },
  },
]

export default examples
