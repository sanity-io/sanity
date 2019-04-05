const diffPatch = require('../src/diff-patch')
const setAndUnset = require('./fixtures/set-and-unset')

describe('module api', () => {
  test('can include ifRevisionID', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {ifRevisionID: 'foo'})).toMatchSnapshot()
  })

  test('can include ifRevisionId (lowercase d)', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {ifRevisionId: 'foo'})).toMatchSnapshot()
  })

  test('can pass different document ID', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b, {id: 'moop'})).toMatchSnapshot()
  })

  test('throws if ids do not match', () => {
    const b = {...setAndUnset.b, _id: 'zing'}
    expect(() => diffPatch(setAndUnset.a, b)).toThrowError(
      `_id on itemA and itemB not present or differs, specify document id the mutations should be applied to`
    )
  })

  test('does not throw if ids do not match and id is provided', () => {
    const b = {...setAndUnset.b, _id: 'zing'}
    expect(diffPatch(setAndUnset.a, b, {id: 'yup'})).toHaveLength(2)
  })
})
