const diffPatch = require('../src/diff-patch')
const objectArrayAdd = require('./fixtures/object-array-add')
const objectArrayRemove = require('./fixtures/object-array-remove')
const objectArrayChange = require('./fixtures/object-array-change')

describe('object arrays', () => {
  test('change item', () => {
    expect(diffPatch(objectArrayChange.a, objectArrayChange.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "characters[_key==\\"simon\\"].name": "Simon Grüber",
      },
    },
  },
]
`)
  })

  test('add to end (single)', () => {
    expect(diffPatch(objectArrayAdd.a, objectArrayAdd.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "insert": Object {
        "after": "characters[-1]",
        "items": Array [
          Object {
            "_key": "simon",
            "name": "Simon Gruber",
          },
        ],
      },
    },
  },
]
`)
  })

  test('add to end (multiple)', () => {
    expect(diffPatch(objectArrayAdd.a, objectArrayAdd.c)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "insert": Object {
        "after": "characters[-1]",
        "items": Array [
          Object {
            "_key": "simon",
            "name": "Simon Gruber",
          },
          Object {
            "_key": "zeus",
            "name": "Zeus Carver",
          },
        ],
      },
    },
  },
]
`)
  })

  test('remove from end (single)', () => {
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.b)).toMatchInlineSnapshot(`
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
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.c)).toMatchInlineSnapshot(`
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
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.d)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "characters[1]._key": "zeus",
        "characters[1].name": "Zeus Carver",
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
