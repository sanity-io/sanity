// Converts a persisted array to a slate compatible json document
import {createFieldValue} from '../../../state/FormBuilderState'
import {Plain} from 'slate'
import Block from 'slate/lib/models/block'
import Document from 'slate/lib/models/document'
import State from 'slate/lib/models/state'
import Character from 'slate/lib/models/character'
import Mark from 'slate/lib/models/mark'
import Text from 'slate/lib/models/text'

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
    if (node.$type === 'paragraph') {
      return DESERIALIZE.paragraph(node)
    }

    if (node.$type === 'text') {
      return DESERIALIZE.text(node)
    }

    // find type in field definition's `of` property
    const fieldDef = context.field.of.find(ofType => ofType.type === node.$type)

    const value = createFieldValue(node, {field: fieldDef, schema: context.schema, resolveInputComponent: context.resolveInputComponent})

    return Block.create({
      data: {value: value},
      key: node.key,
      type: node.$type,
      isVoid: true
    })
  }
}

export default function toSlate(array, context) {
  if (array.length === 0) {
    return Plain.deserialize('')
  }
  return State.create({
    document: Document.create({
      nodes: Block.createList(array.map(node => DESERIALIZE.node(node, context)))
    })
  })
}
