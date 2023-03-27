import {unset} from '../../patch'
import {withUnsetForEmptyNodes} from '../withUnsetForEmptyNodes'

test('withUnsetForEmptyNodes for array of objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      arr: [{_key: 'foo'}],
    },
    [unset(['arr', {_key: 'foo'}])]
  )

  expect(result).toMatchObject([
    {
      path: ['arr'],
      type: 'unset',
    },
  ])
})

test('withUnsetForEmptyNodes for array of primitives', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      arr: ['test'],
    },
    [unset(['arr', 0])]
  )
  expect(result).toMatchObject([
    {
      path: ['arr'],
      type: 'unset',
    },
  ])
})

test('withUnsetForEmptyNodes for objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      obj: {foo: 'bar'},
    },
    [unset(['obj', 'foo'])]
  )
  expect(result).toMatchObject([
    {
      path: ['obj'],
      type: 'unset',
    },
  ])
})

test('withUnsetForEmptyNodes recursively unsets objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      obj: {some: {nested: {value: 'here'}}},
    },
    [unset(['obj', 'some', 'nested', 'value'])]
  )
  expect(result).toMatchObject([
    {
      path: ['obj'],
      type: 'unset',
    },
  ])
})
