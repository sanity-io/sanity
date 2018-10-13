const diffPatch = require('../src/diff-patch')
const primitiveArrayAdd = require('./fixtures/primitive-array-add')
const primitiveArrayRemove = require('./fixtures/primitive-array-remove')

describe('primitive arrays', () => {
  test('add to end (single)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "insert": Object {
        "after": "characters[-1]",
        "items": Array [
          "Simon Gruber",
        ],
      },
    },
  },
]
`)
  })

  test('add to end (multiple)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.c)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "insert": Object {
        "after": "characters[-1]",
        "items": Array [
          "Simon Gruber",
          "Zeus Carver",
        ],
      },
    },
  },
]
`)
  })

  test('remove from end (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "unset": Array [
        "characters[2]",
      ],
    },
  },
]
`)
  })

  test('remove from end (multiple)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.c)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "unset": Array [
        "characters[1:]",
      ],
    },
  },
]
`)
  })

  test('remove from middle (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.d)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "characters[1]": "Zeus Carver",
      },
    },
  },
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "unset": Array [
        "characters[2]",
      ],
    },
  },
]
`)
  })
})
