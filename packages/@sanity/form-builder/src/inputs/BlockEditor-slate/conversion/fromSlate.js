import assert from 'assert'
import {
  SLATE_LIST_ITEM_TYPE,
  SLATE_TEXT_BLOCKS,
  SLATE_LIST_BLOCKS,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS
} from '../constants'

import {pick} from 'lodash'

export const SERIALIZE = {
  block(block, context = {}) {
    if (SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE).includes(block.type)) {
      return SERIALIZE.textBlock(block, block.nodes, context)
    }

    if (SLATE_LIST_BLOCKS.includes(block.type)) {
      return SERIALIZE.listBlock(block, block.nodes, context)
    }

    const validTypeNames = context.type.of.map(ofType => ofType.name)
    assert(
      validTypeNames.includes(block.type),
      `Expected block type (${block.type}) to be one of ${validTypeNames.join(', ')}`
    )

    // We now have a block that is a form builder type
    const value = block.data.get('value')
    return {
      _type: block.type,
      key: block.key,
      ...value.toJSON()
    }
  },

  document(document, context = {}) {
    return document.nodes
      .toArray()
      .map(node => SERIALIZE.node(node, context))
  },

  node(node, context) {
    switch (node.kind) {
      case 'block':
        return SERIALIZE.block(node, context)
      case 'inline':
        return SERIALIZE.inline(node, context)
      case 'text':
        return SERIALIZE.text(node, context)
      default: {
        throw new Error(`Unrecognized node kind "${node.kind}".`)
      }
    }
  },

  range(range, context = {}) {
    return {
      _type: 'span',
      text: range.text,
      marks: range.marks
        .toArray()
        .map(mark => SERIALIZE.mark(mark, context))
    }
  },

  text(text, context = {}) {
    return text
      .getRanges()
      .toArray()
      .map(range => SERIALIZE.range(range, context))
  },

  inline(inline, context = {}) {
    const validTypeNames = context.type.of.map(ofType => ofType.name)

    // Is it a formbuilder inline field?
    if (validTypeNames.includes(inline.type)) {
      const value = inline.data.get('value')
      return {
        _type: inline.type,
        key: inline.key,
        ...value.toJSON()
      }
    }
    // Regular slate inline node
    return Object.assign(
      {
        key: inline.key,
        _type: inline.type,
        children: inline.nodes
          .toArray()
          .map(node => SERIALIZE.node(node, context))
      },
      pick(inline.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    )
  },

  mark(mark, context = {}) {
    return {
      type: mark.type
    }
  },

  textBlock(block, nodes, context = {}) {
    return Object.assign(
      {
        key: block.key,
        _type: 'block',
        spans: nodes
          .toArray()
          .map(node => SERIALIZE.node(node, context))
      }
    )
  },

  listBlock(block, nodes, context = {}) {
    return Object.assign(
      {
        key: block.key,
        _type: block.type,
        children: nodes
          .toArray()
          .map(node => SERIALIZE.node(node, context))
      },
      pick(block.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    )
  }

}

export default function fromSlate(state, context) {
  return SERIALIZE.document(state.document, context)
}
