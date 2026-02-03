import {expect, it} from 'vitest'

import {flattenArray, flattenObject} from './flatten'

it('should flatten simple objects', () => {
  expect([
    ...flattenObject({
      _type: 'alpha',
      x: {
        _type: 'beta',
        y: 'z',
      },
    }),
  ]).toMatchInlineSnapshot(`
    [
      [
        "_type",
        "alpha",
        {
          "flatPathArray": [
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x",
        {
          "_type": "beta",
          "y": "z",
        },
        {
          "flatPathArray": [
            "x",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
          ],
        },
      ],
      [
        "x._type",
        "beta",
        {
          "flatPathArray": [
            "x",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x.y",
        "z",
        {
          "flatPathArray": [
            "x",
            "y",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "y",
              },
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('should flatten complex objects', () => {
  expect([
    ...flattenObject({
      _type: 'alpha',
      a: {
        _type: 'beta',
        b: {
          _type: 'gamma',
          c: ['c1', 'c2', 'c3'],
        },
        d: 'e',
      },
      x: {
        _type: 'delta',
        y: 'z',
      },
    }),
  ]).toMatchInlineSnapshot(`
    [
      [
        "_type",
        "alpha",
        {
          "flatPathArray": [
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "a",
        {
          "_type": "beta",
          "b": {
            "_type": "gamma",
            "c": [
              "c1",
              "c2",
              "c3",
            ],
          },
          "d": "e",
        },
        {
          "flatPathArray": [
            "a",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
          ],
        },
      ],
      [
        "a._type",
        "beta",
        {
          "flatPathArray": [
            "a",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b",
        {
          "_type": "gamma",
          "c": [
            "c1",
            "c2",
            "c3",
          ],
        },
        {
          "flatPathArray": [
            "a",
            "b",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
          ],
        },
      ],
      [
        "a.b._type",
        "gamma",
        {
          "flatPathArray": [
            "a",
            "b",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c",
        [
          "c1",
          "c2",
          "c3",
        ],
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
          ],
        },
      ],
      [
        "a.b.c[0]",
        "c1",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            0,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 0,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c[1]",
        "c2",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            1,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 1,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c[2]",
        "c3",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            2,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 2,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.d",
        "e",
        {
          "flatPathArray": [
            "a",
            "d",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "d",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x",
        {
          "_type": "delta",
          "y": "z",
        },
        {
          "flatPathArray": [
            "x",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "delta",
            },
          ],
        },
      ],
      [
        "x._type",
        "delta",
        {
          "flatPathArray": [
            "x",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "delta",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x.y",
        "z",
        {
          "flatPathArray": [
            "x",
            "y",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "delta",
            },
            {
              "segment": {
                "_key": "y",
              },
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('should flatten arrays of primitives', () => {
  expect([...flattenArray(['a', 1, true, undefined, null])]).toMatchInlineSnapshot(`
    [
      [
        "[0]",
        "a",
        {
          "flatPathArray": [
            0,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 0,
              "type": "string",
            },
          ],
        },
      ],
      [
        "[1]",
        1,
        {
          "flatPathArray": [
            1,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 1,
              "type": "number",
            },
          ],
        },
      ],
      [
        "[2]",
        true,
        {
          "flatPathArray": [
            2,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 2,
              "type": "boolean",
            },
          ],
        },
      ],
      [
        "[3]",
        undefined,
        {
          "flatPathArray": [
            3,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 3,
              "type": "undefined",
            },
          ],
        },
      ],
      [
        "[4]",
        null,
        {
          "flatPathArray": [
            4,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 4,
              "type": "object",
            },
          ],
        },
      ],
    ]
  `)
})

it('should flatten arrays of objects', () => {
  expect([
    ...flattenArray([
      {
        _key: 'x',
        _type: 'alpha',
        x: {
          _type: 'beta',
          y: 'z',
        },
      },
    ]),
  ]).toMatchInlineSnapshot(`
    [
      [
        "[_key=="x"]",
        {
          "_key": "x",
          "_type": "alpha",
          "x": {
            "_type": "beta",
            "y": "z",
          },
        },
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
          ],
        },
      ],
      [
        "[_key=="x"]._key",
        "x",
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
            "_key",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_key",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="x"]._type",
        "alpha",
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="x"].x",
        {
          "_type": "beta",
          "y": "z",
        },
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
            "x",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
          ],
        },
      ],
      [
        "[_key=="x"].x._type",
        "beta",
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
            "x",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="x"].x.y",
        "z",
        {
          "flatPathArray": [
            {
              "_key": "x",
            },
            "x",
            "y",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "x",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "y",
              },
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('should flatten complex arrays', () => {
  expect([
    ...flattenArray([
      'a',
      'b',
      'c',
      {
        _key: 'd',
        _type: 'alpha',
        d: 'e',
        f: ['h'],
      },
    ]),
  ]).toMatchInlineSnapshot(`
    [
      [
        "[0]",
        "a",
        {
          "flatPathArray": [
            0,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 0,
              "type": "string",
            },
          ],
        },
      ],
      [
        "[1]",
        "b",
        {
          "flatPathArray": [
            1,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 1,
              "type": "string",
            },
          ],
        },
      ],
      [
        "[2]",
        "c",
        {
          "flatPathArray": [
            2,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 2,
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="d"]",
        {
          "_key": "d",
          "_type": "alpha",
          "d": "e",
          "f": [
            "h",
          ],
        },
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
          ],
        },
      ],
      [
        "[_key=="d"]._key",
        "d",
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
            "_key",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_key",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="d"]._type",
        "alpha",
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="d"].d",
        "e",
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
            "d",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "d",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="d"].f",
        [
          "h",
        ],
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
            "f",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "f",
              },
              "type": "array",
            },
          ],
        },
      ],
      [
        "[_key=="d"].f[0]",
        "h",
        {
          "flatPathArray": [
            {
              "_key": "d",
            },
            "f",
            0,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "d",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "f",
              },
              "type": "array",
            },
            {
              "segment": 0,
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('skips arrays that directly descend arrays', () => {
  // @ts-expect-error contrived failure doesn't satisfy expected type, but could occur at runtime
  expect([...flattenArray([['a'], 'b'])]).toMatchInlineSnapshot(`
    [
      [
        "[1]",
        "b",
        {
          "flatPathArray": [
            1,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": 1,
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('skips unkeyed objects in arrays', () => {
  expect([
    ...flattenArray(
      [
        {
          _key: 'a',
          _type: 'alpha',
        },
        // @ts-expect-error contrived failure doesn't satisfy expected type, but could occur at runtime
        {
          notKey: 'b',
          _type: 'beta',
        },
      ],
      {compact: true},
    ),
  ]).toMatchInlineSnapshot(`
    [
      [
        "[_key=="a"]._key",
        "a",
        {
          "flatPathArray": [
            {
              "_key": "a",
            },
            "_key",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_key",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "[_key=="a"]._type",
        "alpha",
        {
          "flatPathArray": [
            {
              "_key": "a",
            },
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})

it('skips objects and arrays when operating in compact mode', () => {
  expect([
    ...flattenObject(
      {
        a: {
          _type: 'alpha',
          b: {
            _type: 'beta',
            c: ['c1', 'c2', 'c3'],
          },
          d: 'e',
        },
        x: {
          _type: 'gamma',
          y: 'z',
        },
      },
      {
        compact: true,
      },
    ),
  ]).toMatchInlineSnapshot(`
    [
      [
        "a._type",
        "alpha",
        {
          "flatPathArray": [
            "a",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b._type",
        "beta",
        {
          "flatPathArray": [
            "a",
            "b",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c[0]",
        "c1",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            0,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 0,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c[1]",
        "c2",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            1,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 1,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.b.c[2]",
        "c3",
        {
          "flatPathArray": [
            "a",
            "b",
            "c",
            2,
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "b",
              },
              "type": "beta",
            },
            {
              "segment": {
                "_key": "c",
              },
              "type": "array",
            },
            {
              "segment": 2,
              "type": "string",
            },
          ],
        },
      ],
      [
        "a.d",
        "e",
        {
          "flatPathArray": [
            "a",
            "d",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "a",
              },
              "type": "alpha",
            },
            {
              "segment": {
                "_key": "d",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x._type",
        "gamma",
        {
          "flatPathArray": [
            "x",
            "_type",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "_type",
              },
              "type": "string",
            },
          ],
        },
      ],
      [
        "x.y",
        "z",
        {
          "flatPathArray": [
            "x",
            "y",
          ],
          "flatPathArrayWithTypes": [
            {
              "segment": {
                "_key": "x",
              },
              "type": "gamma",
            },
            {
              "segment": {
                "_key": "y",
              },
              "type": "string",
            },
          ],
        },
      ],
    ]
  `)
})
