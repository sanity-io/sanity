import {test} from 'tap'
import {createFormBuilderState} from '../src/state/FormBuilderState'
import ObjectContainer from '../src/inputs/Object/ObjectContainer'
import ArrayContainer from '../src/inputs/Array/ArrayContainer'
import {Schema} from '../src'

import schemaDef from './fixtures/schema'

const compiledSchema = Schema.compile(schemaDef)

const rawValue = {
  _type: 'user',
  name: 'foo',
  addresses: [
    {
      _key: 'abcdefg',
      _type: 'address',
      zip: '2012',
      location: {
        _type: 'latlon',
        lat: 231,
        lon: 31
      }
    }
  ]
}

function defaultResolveContainer(field, type) {
  switch (field.type) {
    case 'object':
      return ObjectContainer
    case 'array':
      return ArrayContainer
    default:
  }
  switch (type.type) {
    case 'object':
      return ObjectContainer
    case 'array':
      return ArrayContainer
    default:
  }
  return undefined
}

function resolveInputComponent(...args) {
  return {valueContainer: defaultResolveContainer(...args)}
}

const defaultContext = {
  type: compiledSchema.getType('user'),
  schema: compiledSchema,
  resolveInputComponent
}

test('create from raw value', t => {
  const state = createFormBuilderState(rawValue, defaultContext)
  t.same(state.serialize(), rawValue)
  t.end()
})

test('create from empty', t => {
  const state = createFormBuilderState(undefined, defaultContext)
  t.same(state.serialize(), undefined)
  t.end()
})
