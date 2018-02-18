const diffPatch = require('../src/diff-patch')
const primitiveArrayAdd = require('./fixtures/primitive-array-add')
const primitiveArrayRemove = require('./fixtures/primitive-array-remove')

describe('primitive arrays', () => {
  test('add to end (single)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.b)).toEqual({
      set: {
        'characters[1]': 'Simon Gruber'
      }
    })
  })

  test('add to end (multiple)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.c)).toEqual({
      set: {
        'characters[1]': 'Simon Gruber',
        'characters[2]': 'Zeus Carver'
      }
    })
  })

  test('remove from end (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.b)).toEqual({
      unset: ['characters[2:]']
    })
  })

  test('remove from end (multiple)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.c)).toEqual({
      unset: ['characters[1:]']
    })
  })

  test('remove from middle (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.d)).toEqual({
      set: {
        'characters[1]': 'Zeus Carver'
      },
      unset: ['characters[2:]']
    })
  })
})
