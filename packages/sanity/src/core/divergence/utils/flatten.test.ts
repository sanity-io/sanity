import {expect, it} from 'vitest'

import {flattenArray, flattenObject} from './flatten'

it('should flatten simple objects', () => {
  expect([
    ...flattenObject({
      x: {
        y: 'z',
      },
    }),
  ]).toMatchInlineSnapshot(`
    [
      [
        "x",
        {
          "y": "z",
        },
      ],
      [
        "x.y",
        "z",
      ],
    ]
  `)
})

it('should flatten complex objects', () => {
  expect([
    ...flattenObject({
      a: {
        b: {
          c: ['c1', 'c2', 'c3'],
        },
        d: 'e',
      },
      x: {
        y: 'z',
      },
    }),
  ]).toMatchInlineSnapshot(`
    [
      [
        "a",
        {
          "b": {
            "c": [
              "c1",
              "c2",
              "c3",
            ],
          },
          "d": "e",
        },
      ],
      [
        "a.b",
        {
          "c": [
            "c1",
            "c2",
            "c3",
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
      ],
      [
        "a.b.c[0]",
        "c1",
      ],
      [
        "a.b.c[1]",
        "c2",
      ],
      [
        "a.b.c[2]",
        "c3",
      ],
      [
        "a.d",
        "e",
      ],
      [
        "x",
        {
          "y": "z",
        },
      ],
      [
        "x.y",
        "z",
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
      ],
      [
        "[1]",
        1,
      ],
      [
        "[2]",
        true,
      ],
      [
        "[3]",
        undefined,
      ],
      [
        "[4]",
        null,
      ],
    ]
  `)
})

it('should flatten arrays of objects', () => {
  expect([
    ...flattenArray([
      {
        _key: 'x',
        x: {
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
          "x": {
            "y": "z",
          },
        },
      ],
      [
        "[_key=="x"]._key",
        "x",
      ],
      [
        "[_key=="x"].x",
        {
          "y": "z",
        },
      ],
      [
        "[_key=="x"].x.y",
        "z",
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
        d: 'e',
        f: ['h'],
      },
    ]),
  ]).toMatchInlineSnapshot(`
    [
      [
        "[0]",
        "a",
      ],
      [
        "[1]",
        "b",
      ],
      [
        "[2]",
        "c",
      ],
      [
        "[_key=="d"]",
        {
          "_key": "d",
          "d": "e",
          "f": [
            "h",
          ],
        },
      ],
      [
        "[_key=="d"]._key",
        "d",
      ],
      [
        "[_key=="d"].d",
        "e",
      ],
      [
        "[_key=="d"].f",
        [
          "h",
        ],
      ],
      [
        "[_key=="d"].f[0]",
        "h",
      ],
    ]
  `)
})

it('should skip arrays that directly descend arrays', () => {
  // @ts-expect-error contrived failure doesn't satisfy expected type, but could occur at runtime
  expect([...flattenArray([['a'], 'b'])]).toMatchInlineSnapshot(`
    [
      [
        "[1]",
        "b",
      ],
    ]
  `)
})

it('should skip objects and arrays when operating in compact mode', () => {
  expect([
    ...flattenObject(
      {
        a: {
          b: {
            c: ['c1', 'c2', 'c3'],
          },
          d: 'e',
        },
        x: {
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
        "a.b.c[0]",
        "c1",
      ],
      [
        "a.b.c[1]",
        "c2",
      ],
      [
        "a.b.c[2]",
        "c3",
      ],
      [
        "a.d",
        "e",
      ],
      [
        "x.y",
        "z",
      ],
    ]
  `)
})
