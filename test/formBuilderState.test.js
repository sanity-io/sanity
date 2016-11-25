import {test} from 'tap'
import {createFormBuilderState} from '../src/state/FormBuilderState'
import ObjectContainer from '../src/inputs/Object/ObjectContainer'
import ArrayContainer from '../src/inputs/Array/ArrayContainer'
import {Schema} from '../src'

import schemaDef from './fixtures/schema'

const compiledSchema = Schema.compile(schemaDef)

const rawValue = {
  _type: 'simple',
  someString: 'foo',
  home: {
    _type: 'homeAddress',
    zip: '2012',
    location: {
      _type: 'latlon',
      lat: 231,
      lon: 31
    }
  },
  someLatLon: {
    _type: 'latlon',
    lat: 10,
    lon: 10
  }
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
  type: compiledSchema.getType('simple'),
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

test('create empty, and patch with simple value', {todo: true}, t => {
  const state = createFormBuilderState(undefined, defaultContext)
  const newState = state.patch({
    someString: {$set: 'foobar'}
  })

  t.same(newState.serialize(), {
    _type: 'simple',
    someString: 'foobar'
  })

  t.end()
})


test('apply a patch setting a simple value', {todo: true}, t => {
  const state = createFormBuilderState(rawValue, defaultContext)
  const newState = state.patch({someString: {$set: 'bar'}})
  t.same(newState.serialize(), {
    _type: 'simple',
    someString: 'bar',
    home: {
      _type: 'homeAddress',
      zip: '2012',
      location: {
        _type: 'latlon',
        lat: 231,
        lon: 31
      }
    },
    someLatLon: {
      _type: 'latlon',
      lat: 10,
      lon: 10
    }
  })
  t.end()
})

test('apply a patch by replacing a tree', {todo: true}, t => {
  const state = createFormBuilderState(rawValue, defaultContext)

  const newState = state.patch({
    home: {
      location: {
        lat: {$set: 666},
        lon: {$set: 444}
      }
    }
  })

  t.same(newState.serialize(), {
    _type: 'simple',
    someString: 'foo',
    home: {
      _type: 'homeAddress',
      zip: '2012',
      location: {
        _type: 'latlon',
        lat: 666,
        lon: 444
      }
    },
    someLatLon: {
      _type: 'latlon',
      lat: 10,
      lon: 10
    }
  })
  t.end()
})


test('custom container', {todo: true}, t => {

  class NumberContainer {
    constructor(value, context) {
      this.value = value
      this.context = context
    }

    patch(patch) {
      if (patch.hasOwnProperty('$set')) {
        this.value = patch.$set
        return new NumberContainer(patch.$set, this.context)
      }
      throw new Error(`Only $set is supported by NumberContainer, got: ${JSON.stringify(patch)}`)
    }

    serialize() {
      return this.value.trim() ? Number(this.value) : undefined
    }
  }

  NumberContainer.wrap = function wrap(val) {
    return new NumberContainer(String(val))
  }

  const state = createFormBuilderState(rawValue, {
    type: compiledSchema.getType('simple'),
    schema: compiledSchema,
    resolveInputComponent
  })

  const newState = state.patch({
    home: {
      location: {
        lat: {$set: '666'},
        lon: {$set: '444'}
      }
    }
  })

  t.same(newState.serialize(), {
    _type: 'simple',
    someString: 'foo',
    home: {
      _type: 'homeAddress',
      zip: '2012',
      location: {
        _type: 'latlon',
        lat: 666,
        lon: 444
      }
    },
    someLatLon: {
      _type: 'latlon',
      lat: 10,
      lon: 10
    }
  })
  t.end()
})
