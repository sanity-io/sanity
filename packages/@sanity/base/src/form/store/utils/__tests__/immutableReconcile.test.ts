import {immutableReconcile} from '../immutableReconcile'
import {JsonObject} from 'type-fest'

test('immutableReconcile', () => {
  const prev = {test: 'hi'}
  const next = {test: 'hi'}
  expect(immutableReconcile(prev, next)).toStrictEqual(prev)
})

test('immutableReconcile2', () => {
  const prev: JsonObject = {test: 'hi', carryOver: ['aloha']}
  const next: JsonObject = {test: 'hi', carryOver: ['aloha'], new: ['foo', 'bar']}

  const result = immutableReconcile(prev, next)

  expect(result.carryOver).toStrictEqual(prev.carryOver)
})
