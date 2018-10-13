const diffPatch = require('../src/diff-patch')
const setAndUnset = require('./fixtures/set-and-unset')

describe('module api', () => {
  test('can include ifRevisionID', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {ifRevisionID: 'foo'})).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "ifRevisionID": "foo",
      "set": Object {
        "slug.current": "die-hard-with-a-vengeance",
      },
    },
  },
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "ifRevisionID": "foo",
      "unset": Array [
        "year",
        "slug.auto",
      ],
    },
  },
]
`)
  })

  test('can include ifRevisionId (lowercase d)', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {ifRevisionId: 'foo'})).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "ifRevisionID": "foo",
      "set": Object {
        "slug.current": "die-hard-with-a-vengeance",
      },
    },
  },
  Object {
    "patch": Object {
      "id": "die-hard-iii",
      "ifRevisionID": "foo",
      "unset": Array [
        "year",
        "slug.auto",
      ],
    },
  },
]
`)
  })

  test('can pass different document ID', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {id: 'moop'})).toMatchInlineSnapshot(`
Array [
  Object {
    "patch": Object {
      "id": "moop",
      "set": Object {
        "slug.current": "die-hard-with-a-vengeance",
      },
    },
  },
  Object {
    "patch": Object {
      "id": "moop",
      "unset": Array [
        "year",
        "slug.auto",
      ],
    },
  },
]
`)
  })

  test('throws if ids do not match', () => {
    const b = {...setAndUnset.b, _id: 'zing'}
    expect(() => diffPatch(setAndUnset.a, b)).toThrowErrorMatchingInlineSnapshot(
      `"_id on itemA and itemB not present or differs, specify document id the mutations should be applied to"`
    )
  })

  test('does not throw if ids do not match and id is provided', () => {
    const b = {...setAndUnset.b, _id: 'zing'}
    expect(diffPatch(setAndUnset.a, b, {id: 'yup'})).toHaveLength(2)
  })
})
