import assert from 'assert'
import isEmpty from 'is-empty'
import {SLATE_TEXT_BLOCKS, SLATE_LIST_BLOCKS, SLATE_BLOCK_FORMATTING_OPTION_KEYS} from '../constants'
import {pick} from 'lodash'

function collapse(value) {
  return isEmpty(value) ? undefined : value
}

const SERIALIZE = {
  block(block, context = {}) {
    if (SLATE_TEXT_BLOCKS.includes(block.type)) {
      assert(
        block.nodes.size === 1,
        `Expected ${block.type} blocks to have a single node, instead it had ${block.nodes.size} nodes`
      )
      // Skip the field def
      return SERIALIZE.textBlock(block, block.nodes.get(0), context)
    }

    if (SLATE_LIST_BLOCKS.includes(block.type)) {
      return SERIALIZE.listBlock(block, block.nodes, context)
    }

    const validTypeNames = context.field.of.map(ofType => ofType.type)
    assert(
      validTypeNames.includes(block.type),
      `Expected block type (${block.type}) to be one of ${validTypeNames.join(', ')}`
    )

    // We now have a block that is a form builder field
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

  inline(inline, context = {}) {
    return {
      data: collapse(inline.data.toJSON()),
      key: inline.key,
      kind: inline.kind,
      isVoid: inline.isVoid,
      type: inline.type,
      nodes: inline.nodes
        .toArray()
        .map(node => SERIALIZE.node(node, context))
    }
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
      kind: 'range',
      text: range.text,
      marks: range.marks
        .toArray()
        .map(mark => SERIALIZE.mark(mark, context))
    }
  },

  textBlock(block, text, context = {}) {
    return Object.assign(
      {
        key: text.key,
        _type: block.type,
        ranges: text
          .getRanges()
          .toArray()
          .map(range => SERIALIZE.range(range, context))
      },
      pick(block.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    )
  },

  listBlock(block, items, context = {}) {
    return Object.assign(
      {
        key: block.key,
        _type: block.type,
        items: items
          .toArray()
          .map(item => SERIALIZE.textBlock(item, item.nodes.get(0), context))

      },
      pick(block.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    )
  },

  mark(mark, context = {}) {
    return {
      type: mark.type
    }
  }
}

export default function fromSlate(state, context) {
  return SERIALIZE.document(state.document, context)
}
