/* eslint-disable id-length, quote-props */

export default [
  {
    name: 'Simple path setIfMissing, value not missing',
    before: {
      a: {
        b: 7,
      },
    },
    patch: {
      setIfMissing: {
        'a.b': 10,
      },
    },
    after: {
      a: {
        b: 7,
      },
    },
  },
  {
    name: 'Simple path setIfMissing',
    before: {
      a: {
        b: 7,
      },
    },
    patch: {
      setIfMissing: {
        'a.c': 10,
      },
    },
    after: {
      a: {
        b: 7,
        c: 10,
      },
    },
  },
  {
    name: 'Recursive set if missing',
    before: {
      z: [
        {a: 7, p: 'Thorvald Meyers gt.', zz: {yyy: 55}},
        {b: 7, p: 'Thorvald Meyers gt.', zz: {yyy: 55, zzz: 10}},
      ],
    },
    patch: {
      setIfMissing: {
        '..[p=="Thorvald Meyers gt."].zz.zzz': 100,
      },
    },
    after: {
      z: [
        {a: 7, p: 'Thorvald Meyers gt.', zz: {yyy: 55, zzz: 100}},
        {b: 7, p: 'Thorvald Meyers gt.', zz: {yyy: 55, zzz: 10}},
      ],
    },
  }, // Potentially redundant, added to exactly match a test case from @sanity/form-builder that was failing.
  {
    name: 'Set if missing by key',
    before: {
      addresses: [
        {_type: 'address', street: 'Thorvald Meyers gate', location: {_type: 'latlon', lat: 45}},
        {
          _type: 'address',
          street: 'Thorvald Meyers gate',
          location: {_type: 'latlon', lat: 41, lon: 22},
        },
      ],
    },
    patch: {
      setIfMissing: {
        '..[street=="Thorvald Meyers gate"].location.lon': 61,
      },
    },
    after: {
      addresses: [
        {
          _type: 'address',
          street: 'Thorvald Meyers gate',
          location: {_type: 'latlon', lat: 45, lon: 61},
        },
        {
          _type: 'address',
          street: 'Thorvald Meyers gate',
          location: {_type: 'latlon', lat: 41, lon: 22},
        },
      ],
    },
  },
]
