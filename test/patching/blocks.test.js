import {test} from 'tap'
import {createFormBuilderState} from '../../src/state/FormBuilderState'
import Schema from '../../src/Schema'
import schemaDef from './blocks-schema'
import ObjectContainer from '../../src/inputs/Object/ObjectContainer'
import ArrayContainer from '../../src/inputs/Array/ArrayContainer'
import PrimitiveValueContainer from '../../src/state/PrimitiveValueContainer'
import SlateValueContainer from './containers/SlateValueContainer'
import EXAMPLE_VALUE from './blocks-value.json'
import {Patcher} from '@sanity/mutator'
const compiledSchema = Schema.compile(schemaDef)

function defaultResolveContainer(field, type) {
  switch (field.type) {
    case 'object':
      return ObjectContainer
    case 'array':
      return field.editor === 'slate' ? SlateValueContainer : ArrayContainer
    default:
  }
  switch (type.type) {
    case 'object':
      return ObjectContainer
    case 'array':
      return type.editor === 'slate' ? SlateValueContainer : ArrayContainer
    default:
  }
  return PrimitiveValueContainer
}

function resolveInputComponent(...args) {
  return {
    valueContainer: defaultResolveContainer(...args)
  }
}

test('slate value container', t => {
  const state = createFormBuilderState(EXAMPLE_VALUE, {
    type: compiledSchema.getType('blogpost'),
    schema: compiledSchema,
    resolveInputComponent
  })


  // const content = state.getAttribute('content')
  // console.log(content)

  const patch = new Patcher({
    set: {
      'content[key== "4"].key': 'foo'
    }
  })

  const nextValue = patch.applyViaAccessor(state)
  // console.log(JSON.stringify(nextValue.serialize()))

  // t.same(nextValue.serialize(), {_type: 'user', name: 'Carl Sagan', addresses: []})

  t.end()
})
