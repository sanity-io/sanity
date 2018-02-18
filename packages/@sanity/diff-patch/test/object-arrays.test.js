const diffPatch = require('../src/diff-patch')
const objectArrayAdd = require('./fixtures/object-array-add')
const objectArrayRemove = require('./fixtures/object-array-remove')
const objectArrayChange = require('./fixtures/object-array-change')

describe('object arrays', () => {
  test('change item', () => {
    expect(diffPatch(objectArrayChange.a, objectArrayChange.b)).toEqual({
      set: {
        'characters[_key=="simon"].name': 'Simon Grüber'
      }
    })
  })

  test('add to end (single)', () => {
    expect(diffPatch(objectArrayAdd.a, objectArrayAdd.b)).toEqual({
      set: {
        'characters[1]': {
          _key: 'simon',
          name: 'Simon Gruber'
        }
      }
    })
  })

  test('add to end (multiple)', () => {
    expect(diffPatch(objectArrayAdd.a, objectArrayAdd.c)).toEqual({
      set: {
        'characters[1]': {
          _key: 'simon',
          name: 'Simon Gruber'
        },
        'characters[2]': {
          _key: 'zeus',
          name: 'Zeus Carver'
        }
      }
    })
  })

  test('remove from end (single)', () => {
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.b)).toEqual({
      unset: ['characters[2:]']
    })
  })

  test('remove from end (multiple)', () => {
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.c)).toEqual({
      unset: ['characters[1:]']
    })
  })

  test('remove from middle (single)', () => {
    expect(diffPatch(objectArrayRemove.a, objectArrayRemove.d)).toEqual({
      set: {'characters[1]._key': 'zeus', 'characters[1].name': 'Zeus Carver'},
      unset: ['characters[2:]']
    })
  })
})
