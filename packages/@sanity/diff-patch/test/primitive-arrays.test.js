const diffPatch = require('../src/diff-patch')
const primitiveArrayAdd = require('./fixtures/primitive-array-add')
const primitiveArrayRemove = require('./fixtures/primitive-array-remove')

describe('primitive arrays', () => {
  test('add to end (single)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.b)).toMatchSnapshot()
  })

  test('add to end (multiple)', () => {
    expect(diffPatch(primitiveArrayAdd.a, primitiveArrayAdd.c)).toMatchSnapshot()
  })

  test('remove from end (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.b)).toMatchSnapshot()
  })

  test('remove from end (multiple)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.c)).toMatchSnapshot()
  })

  test('remove from middle (single)', () => {
    expect(diffPatch(primitiveArrayRemove.a, primitiveArrayRemove.d)).toMatchSnapshot()
  })
})
