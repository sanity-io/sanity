import {Raw, Plain, Selection} from 'slate'
import isEmpty from 'is-empty'
import assert from 'assert'

function collapse(value) {
  return isEmpty(value) ? undefined : value
}

const SLATE_CORE_BLOCK_TYPES = 'paragraph'.split(' ')

const tap = inspector => value => {
  // inspector(value)
  return value
}
const SERIALIZE = {
  block(block, context = {}) {
    if (block.type === 'paragraph') {
      assert(block.nodes.size === 1, `Expected line blocks to have a single node, instead it had ${block.nodes.size} nodes`)
      // Skip the paragraph def
      return SERIALIZE.paragraph(block.nodes.get(0), context)
    }
    const validTypeNames = context.field.of.map(ofType => ofType.type)
    assert(validTypeNames.includes(block.type), `Expected block type (${block.type}) to be one of ${validTypeNames.join(', ')}`)

    // We now have a block that is a form builder field
    const value = block.data.get('value')
    return {
      $type: block.type,
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

  paragraph(text, context = {}) {
    return {
      key: text.key,
      $type: 'paragraph',
      ranges: text
        .getRanges()
        .toArray()
        .map(range => SERIALIZE.range(range, context))
    }
  }
}

export default function fromSlate(state, context) {
  return tap(v => console.log(v))(SERIALIZE.document(state.document, context)) // eslint-disable-line no-console
}
