import {Schema, Text} from 'prosemirror/dist/model'
import createFormBuilderBlockTypeForField from './createFormBuilderBlockTypeForField'

import {
  Doc,
  Paragraph,
  StrongMark,
  LinkMark,
  EmMark
} from 'prosemirror/dist/schema-basic'

const BASIC_NODES = {
  doc: {type: Doc, content: 'block+'},
  paragraph: {type: Paragraph, content: 'inline<_>*', group: 'block'},
  text: {type: Text, group: 'inline'}
}

const BASIC_MARKS = {
  em: EmMark,
  strong: StrongMark,
  link: LinkMark
}

export default function createProseMirrorSchema(context) {

  const {type, createBlockValue} = context

  const formBuilderManagedNodes = {}

  type.of
    .filter(fieldDef => !(fieldDef.type in BASIC_NODES))
    .forEach(fieldDef => {

      const BlockType = createFormBuilderBlockTypeForField({
        type: fieldDef,
        createBlockValue: createBlockValue.bind(null, fieldDef),
        parentComponent: context.parentComponent
      })

      formBuilderManagedNodes[fieldDef.type] = {type: BlockType, content: '', group: 'block'}
    })

  return new Schema({
    nodes: Object.assign(BASIC_NODES, formBuilderManagedNodes),
    marks: BASIC_MARKS
  })
}
