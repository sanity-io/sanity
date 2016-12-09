import {test} from 'tap'
import {createFormBuilderState} from '../../src/state/FormBuilderState'
import Schema from '../../src/Schema'
import schemaDef from '../fixtures/schema'
import ObjectContainer from '../../src/inputs/Object/ObjectContainer'
import ArrayContainer from '../../src/inputs/Array/ArrayContainer'
import PrimitiveValueContainer from '../../src/state/PrimitiveValueContainer'
import {Patcher} from '@sanity/mutator'

const compiledSchema = Schema.compile(schemaDef)

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
  return PrimitiveValueContainer
}

function resolveInputComponent(...args) {
  return {
    valueContainer: defaultResolveContainer(...args)
  }
}

test('object container', t => {
  const serializedValue = {_type: 'user', someString: 'valueOfSomeString'}

  const state = createFormBuilderState(serializedValue, {
    type: compiledSchema.getType('user'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const patch = new Patcher({set: {name: 'Carl Sagan'}})
  const nextValue = patch.applyViaAccessor(state)

  t.same(nextValue.serialize(), {_type: 'user', name: 'Carl Sagan'})

  t.end()
})

test('array value container', t => {
  const serializedValue = {
    _type: 'user',
    addresses: [
      {_type: 'address', street: 'Thorvald Meyers gate'},
    ]
  }

  const state = createFormBuilderState(serializedValue, {
    type: compiledSchema.getType('user'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const patch = new Patcher({
    insert: {
      after: 'addresses[-1]',
      items: [
        {_type: 'address', street: 'Markveien'}
      ]
    }
  })

  const nextValue = patch.applyViaAccessor(state)

  // console.log(nextValue.serialize())
  t.same(nextValue.serialize(), {
    _type: 'user',
    addresses: [
      {_type: 'address', street: 'Thorvald Meyers gate'},
      {_type: 'address', street: 'Markveien'}
    ]
  })

  t.end()
})

test('deep set', t => {
  const serializedValue = {
    _type: 'user',
    addresses: [
      {_type: 'address', street: 'Thorvald Meyers gate', location: {_type: 'latlon', lat: 45}},
    ]
  }

  const state = createFormBuilderState(serializedValue, {
    type: compiledSchema.getType('user'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const patch = new Patcher({
    set: {
      'addresses[0].location.lon': 61
    }
  })

  const nextValue = patch.applyViaAccessor(state)

  t.same(nextValue.serialize(), {
    _type: 'user',
    addresses: [
      {
        _type: 'address',
        street: 'Thorvald Meyers gate',
        location: {_type: 'latlon', lat: 45, lon: 61}
      },
    ]
  })

  t.end()
})

test('deep set multiple indices', t => {
  const serializedValue = {
    _type: 'user',
    addresses: [
      {_type: 'address', street: 'Thorvald Meyers gate', location: {_type: 'latlon', lat: 45}},
      {_type: 'address', street: 'Markveien', location: {_type: 'latlon', lat: 41}},
    ]
  }

  const state = createFormBuilderState(serializedValue, {
    type: compiledSchema.getType('user'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const patch = new Patcher({
    set: {
      'addresses[0, 1].location.lon': 61
    }
  })

  const nextValue = patch.applyViaAccessor(state)

  t.same(nextValue.serialize(), {
    _type: 'user',
    addresses: [
      {
        _type: 'address',
        street: 'Thorvald Meyers gate',
        location: {_type: 'latlon', lat: 45, lon: 61}
      },
      {
        _type: 'address',
        street: 'Markveien',
        location: {_type: 'latlon', lat: 41, lon: 61}
      },
    ]
  })

  t.end()
})

test('deep set by key', t => {
  const serializedValue = {
    _type: 'user',
    addresses: [
      {_type: 'address', street: 'Thorvald Meyers gate', location: {_type: 'latlon', lat: 45}},
      {_type: 'address', street: 'Thorvald Meyers gate', location: {_type: 'latlon', lat: 41, lon: 22}},
    ]
  }

  const state = createFormBuilderState(serializedValue, {
    type: compiledSchema.getType('user'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const patch = new Patcher({
    setIfMissing: {
      '..[street=="Thorvald Meyers gate"].location.lon': 61
    }
  })

  const nextValue = patch.applyViaAccessor(state)

  t.same(nextValue.serialize(), {
    _type: 'user',
    addresses: [
      {
        _type: 'address',
        street: 'Thorvald Meyers gate',
        location: {_type: 'latlon', lat: 45, lon: 61},
      },
      {
        _type: 'address',
        street: 'Thorvald Meyers gate',
        location: {_type: 'latlon', lat: 41, lon: 22},
      }
    ]
  })

  t.end()
})
