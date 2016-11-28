/* eslint-disable id-length, quote-props */

export default [
  {
    name: 'Insert before index',
    before: {
      a: [0, 1, 2, 3, 4]
    },
    patch: {
      insert: {
        before: 'a[2]',
        items: [-1, -2]
      }
    },
    after: {
      a: [0, 1, -1, -2, 2, 3, 4]
    }
  },

  {
    name: 'Insert after index',
    before: {
      a: [0, 1, 2, 3, 4]
    },
    patch: {
      insert: {
        after: 'a[2]',
        items: [-1, -2]
      }
    },
    after: {
      a: [0, 1, 2, -1, -2, 3, 4]
    }
  },

  {
    name: 'Insert after empty',
    before: {
      a: []
    },
    patch: {
      insert: {
        after: 'a[-1]',
        items: [-1, -2]
      }
    },
    after: {
      a: [-1, -2]
    }
  },

  {
    name: 'Insert object in array',
    before: {
      addresses: [{address: 'Mogata 24'}]
    },
    patch: {
      insert: {
        after: 'addresses[-1]',
        items: [{address: '123 Banana Rd.'}]
      }
    },
    after: {
      addresses: [{address: 'Mogata 24'}, {address: '123 Banana Rd.'}]
    }
  }
]
