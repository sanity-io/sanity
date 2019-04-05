const diffPatch = require('../src/diff-patch')
const simple = require('./fixtures/simple')
const nested = require('./fixtures/nested')
const setAndUnset = require('./fixtures/set-and-unset')

describe('set/unset', () => {
  test('simple root-level changes', () => {
    expect(diffPatch(simple.a, simple.b)).toMatchSnapshot()
  })

  test('basic nested changes', () => {
    expect(diffPatch(nested.a, nested.b)).toMatchSnapshot()
  })

  test('set + unset, nested changes', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b)).toMatchSnapshot()
  })

  test('no diff', () => {
    expect(diffPatch(nested.a, nested.a)).toEqual([])
  })
})
