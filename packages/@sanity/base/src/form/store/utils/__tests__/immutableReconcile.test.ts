import {immutableReconcile} from '../immutableReconcile'

test('it preserves previous value if deep equal', () => {
  const prev = {test: 'hi'}
  const next = {test: 'hi'}
  expect(immutableReconcile(prev, next)).toStrictEqual(prev)
})

test('keeps the previous values where they deep equal to the next', () => {
  const prev = {
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {
      x: {y: 'z'},
      keep: {foo: 'bar'},
    },
  }

  const next = {
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {x: {y: 'x'}, keep: {foo: 'bar'}},
    new: ['foo', 'bar'],
  }

  const result = immutableReconcile(prev, next)

  expect(result).not.toStrictEqual(prev)
  expect(result).not.toStrictEqual(next)

  expect(result.array).toStrictEqual(prev.array)
  expect(result.object.keep).toStrictEqual(prev.object.keep)
})

test('does not mutate any of its input', () => {
  const prev = Object.freeze({
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {
      x: {y: 'z'},
      keep: {foo: 'bar'},
    },
  })
  const next = Object.freeze({
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {x: {y: 'x'}, keep: {foo: 'bar'}},
    new: ['foo', 'bar'],
  })

  expect(() => immutableReconcile(prev, next)).not.toThrow()
})
