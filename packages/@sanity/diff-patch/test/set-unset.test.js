const diffPatch = require('../src/diff-patch')
const simple = require('./fixtures/simple')
const nested = require('./fixtures/nested')
const setAndUnset = require('./fixtures/set-and-unset')

describe('set/unset', () => {
  test('simple root-level changes', () => {
    expect(diffPatch(simple.a, simple.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "rating": 4,
        "title": "Die Hard with a Vengeance",
      },
    },
  },
]
`)
  })

  test('basic nested changes', () => {
    expect(diffPatch(nested.a, nested.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "slug.current": "die-hard-with-a-vengeance",
      },
    },
  },
]
`)
  })

  test('set + unset, nested changes', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b)).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "set": Object {
        "slug.current": "die-hard-with-a-vengeance",
      },
    },
  },
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "unset": Array [
        "year",
        "slug.auto",
      ],
    },
  },
]
`)
  })

  test('no diff', () => {
    expect(diffPatch(nested.a, nested.a)).toEqual([])
  })
})
