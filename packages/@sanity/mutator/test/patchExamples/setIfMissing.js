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
  },

  {
    name: 'Recursive set if missing',
    before: {
      z: [
        {a: 7, p: 'Thorvald Meyers gt.', zz: {}},
        {b: 7, p: 'Thorvald Meyers gt.', zz: {zzz: 10}}
      ]
    },
    patch: {
      setIfMissing: {
        '..[p=="Thorvald Meyers gt."].zz.zzz': 100
      }
    },
    after: {
      z: [
        {a: 7, p: 'Thorvald Meyers gt.', zz: {zzz: 100}},
        {b: 7, p: 'Thorvald Meyers gt.', zz: {zzz: 10}}
      ]
    },
  }
]
