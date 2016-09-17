import {createFieldValue} from '../../../state/FormBuilderState'
// Converts a persisted array to a slate compatible json document
import {Plain, Raw} from 'slate'
import dummyRawState from '../tests/slate'
import Block from 'slate/lib/models/block'
import Document from 'slate/lib/models/document'
import State from 'slate/lib/models/state'
import Character from 'slate/lib/models/character'
import Mark from 'slate/lib/models/mark'
import Text from 'slate/lib/models/text'


const tap = inspector => value => {
  inspector(value)
  return value
}
const DESERIALIZE = {
  paragraph(para, context) {
    return Block.create({
      type: 'paragraph',
      data: {},
      isVoid: false,
      nodes: Block.createList([
        Text.create({
          key: para.key,
          characters: para.ranges.reduce((characters, range) => {
            return characters.concat(DESERIALIZE.range(range, context))
          }, Character.createList())
        })
      ])
    })
  },

  range(range, context = {}) {
    return Character.createList(range.text
      .split('')
      .map(char => {
        return Character.create({
          text: char,
          marks: Mark.createSet(range.marks.map(mark => {
            return DESERIALIZE.mark(mark, context)
          }))
        })
      }))
  },

  node(node, context) {
    switch (node.$type) {
      case 'paragraph':
        return DESERIALIZE.paragraph(node)
      case 'text':
        return DESERIALIZE.text(node)
    }
    const {$type, ...rest} = node

    // find type in of
    const fieldDef = context.field.of.find(ofType => ofType.type === $type)

    const value = createFieldValue(node, {field: fieldDef, schema: context.schema, resolveInputComponent: context.resolveInputComponent})

    return Block.create({
      data: {value: value},
      key: node.key,
      type: $type,
      isVoid: true
    })
  }
}

export default function toSlate(array, context) {
  if (array.length === 0) {
    // return Plain.deserialize('')
    return Raw.deserialize(dummyRawState)
  }
  return tap(v => console.log(Raw.serialize(v)))(State.create({
    document: Document.create({
      nodes: Block.createList(array.map(node => DESERIALIZE.node(node, context)))
    })
  }))
}
