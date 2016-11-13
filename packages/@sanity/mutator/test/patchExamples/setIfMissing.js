/* eslint-disable id-length, quote-props */

export default [
  {
    name: 'Simple path setIfMissing, value not missing',
    before: {
      a: {
        b: 7
      }
    },
    patch: {
      setIfMissing: {
        'a.b': 10
      }
    },
    after: {
      a: {
        b: 7
      }
    }
  },

  {
    name: 'Simple path setIfMissing',
    before: {
      a: {
        b: 7
      }
    },
    patch: {
      setIfMissing: {
        'a.c': 10
      }
    },
    after: {
      a: {
        b: 7,
        c: 10
      }
    }
  }
]
