import type {PatchExample} from './types'

const examples: PatchExample[] = [
  {
    name: 'Simple path setIfMissing, value not missing',
    before: {
      a: {
        b: 7,
      },
    },
    patch: {
      id: 'a',
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
      id: 'a',
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
      id: 'a',
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
  },
  {
    name: 'Set new deep key',
    before: {},
    patch: {
      id: 'a',
      setIfMissing: {
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
      setIfMissing: {
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
      setIfMissing: {
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
      setIfMissing: {
        'a.b': 'hello',
      },
    },
    after: {
      a: {
        b: 'hello',
      },
    },
  },
  // Potentially redundant, added to exactly match a test case from @sanity/form-builder that was failing.
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
      id: 'a',
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

export default examples
