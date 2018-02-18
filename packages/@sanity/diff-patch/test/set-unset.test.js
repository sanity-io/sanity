const diffPatch = require('../src/diff-patch')
const simple = require('./fixtures/simple')
const nested = require('./fixtures/nested')
const setAndUnset = require('./fixtures/set-and-unset')

describe('set/unset', () => {
  test('simple root-level changes', () => {
    expect(diffPatch(simple.a, simple.b)).toEqual({
      set: {
        title: 'Die Hard with a Vengeance',
        rating: 4
      }
    })
  })

  test('basic nested changes', () => {
    expect(diffPatch(nested.a, nested.b)).toEqual({
      set: {
        'slug.current': 'die-hard-with-a-vengeance'
      }
    })
  })

  test('set + unset, nested changes', () => {
    expect(diffPatch(setAndUnset.a, setAndUnset.b)).toEqual({
      set: {
        'slug.current': 'die-hard-with-a-vengeance'
      },
      unset: ['year', 'slug.auto']
    })
  })

  test('no diff', () => {
    expect(diffPatch(nested.a, nested.a)).toEqual(null)
  })
})
