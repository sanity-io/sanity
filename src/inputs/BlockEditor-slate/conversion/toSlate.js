// Converts a persisted array to a slate compatible json document
import {pick} from 'lodash'
import {Raw, Block, Document, State, Character, Mark, Text, Inline} from 'slate'
import {createFieldValue} from '../../../state/FormBuilderState'
import {SLATE_TEXT_BLOCKS, SLATE_LIST_BLOCKS, SLATE_DEFAULT_NODE, SLATE_BLOCK_FORMATTING_OPTION_KEYS} from '../constants'

export const DESERIALIZE = {
  textBlock(para, context = {}) {
    return Block.create({
      type: para._type,
      data: pick(para, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
      isVoid: false,
      nodes: Block.createList(para.children.map(childChild => {
        return DESERIALIZE.node(childChild, context)
      }))
    })
  },

  listBlock(para, context = {}) {
    return Block.create({
      type: para._type,
      data: pick(para, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
      isVoid: false,
      nodes: Block.createList(para.children.map(child => {
        return Block.create({
          type: 'listItem',
          nodes: Block.createList(child.children.map((childChild) => {
            return DESERIALIZE.node(childChild, context)
          }))
        })
      }))
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

  text(node, context = {}) {
    return Text.create({
      key: node.key,
      characters: node.ranges.reduce((characters, range) => {
        return characters.concat(DESERIALIZE.range(range, context))
      }, Character.createList())
    })
  },


  link(node, context = {}) {
    return Inline.create({
      type: 'link',
      data: pick(node, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
      isVoid: false,
      nodes: Inline.createList(node.children.map(childChild => {
        return DESERIALIZE.node(childChild, context)
      }))
    })
  },

  node(node, context = {}) {

    if (node._type === 'link') {
      return DESERIALIZE.link(node, context)
    }

    if (node._type === 'text') {
      return DESERIALIZE.text(node, context)
    }

    if (SLATE_TEXT_BLOCKS.includes(node._type)) {
      return DESERIALIZE.textBlock(node, context)
    }

    if (SLATE_LIST_BLOCKS.includes(node._type)) {
      return DESERIALIZE.listBlock(node, context)
    }

    // find type in field definition's `of` property
    const fieldDef = context.field.of.find(ofType => ofType.type === node._type)

    const value = createFieldValue(node, {
      field: fieldDef,
      schema: context.schema,
      resolveInputComponent: context.resolveInputComponent
    })

    return Block.create({
      data: {value: value},
      key: node.key,
      type: node._type,
      isVoid: true
    })
  },

  mark(mark, context = {}) {
    return mark
  }
}

export default function toSlate(array, context) {
  if (array.length === 0) {
    return State.create({
      document: Document.create({
        nodes: Block.createList([
          Raw.deserializeNode({
            kind: 'block',
            type: SLATE_DEFAULT_NODE,
            nodes: [
              {kind: 'text', text: '', ranges: []}
            ]
          })
        ])
      })
    })
  }
  return State.create({
    document: Document.create({
      nodes: Block.createList(array.map(node => DESERIALIZE.node(node, context)))
    })
  })
}
