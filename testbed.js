import schema from './example/schemas/messy-dev'
import {createFormBuilderState} from './src/FormBuilderState'
import applyPatch from './src/utils/applyPatch'
import inspect from 'object-inspect'
import assert from 'assert'

import {
  compileSchema,
  fieldInputs
} from './src'


const compiledSchema = compileSchema(schema)

Object.keys(compiledSchema.types).forEach(typeName => {
  const typeDef = compiledSchema.types[typeName]
  if (!fieldInputs[typeName] && fieldInputs[typeDef.type]) {
    fieldInputs[typeName] = fieldInputs[typeDef.type]
  }
})

function resolveFieldInput(field, type) {
  return fieldInputs[field.type]
}

const rawValue = {
  someString: 'foo',
  home: {
    $type: 'home',
    zip: '2012',
    location: {
      lat: 231,
      lon: 31
    }
  },
  someLatLon: {
    $type: 'latlon',
    lat: 10,
    lon: 10
  }
}

const undefinedValue = createFormBuilderState(void 0, {type: schema.types.simple, schema})
const undefinedSet = undefinedValue.patch({someString: {$set: 'boobar'}})
console.log(undefinedSet.unwrap())

// console.log('Contained value', inspect(value))
// console.log('Value value', value.value)
// console.log('Unwrapped value', value.unwrap())


// const newValue = value.patch({someString: {$set: 'bar'}})
// assert(value !== newValue)
// const newValue2 = value.patch({someLatLon: {lat: {$set: 0}}})
// const newValue3 = value.patch({home: {zip: {$set: '0433'}}})
//
// console.log(newValue3.unwrap())

// console.log(newValue.unwrap())
// console.log(newValue2.unwrap())
