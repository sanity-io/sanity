import {Raw, Plain, Selection} from 'slate'
import isEmpty from 'is-empty'
import assert from 'assert'

function collapse(value) {
  return isEmpty(value) ? undefined : value
}

const SLATE_CORE_BLOCK_TYPES = 'paragraph'.split(' ')

const SERIALIZE = {
  block(block, options = {}) {
    if (block.type === 'line') {
      assert(block.nodes.size === 1, `Expected line blocks to have a single node, instead it had ${block.nodes.size} nodes`)
    }
    return {
      $type: block.type,
      key: block.key,
      nodes: block.nodes
        .toArray()
        .map(node => SERIALIZE.node(node, options))
    }
  },
  document(document, options = {}) {
    return document.nodes
      .toArray()
      .map(node => SERIALIZE.node(node, options))
  },

  inline(inline, options = {}) {
    return {
      data: collapse(inline.data.toJSON()),
      key: inline.key,
      kind: inline.kind,
      isVoid: inline.isVoid,
      type: inline.type,
      nodes: inline.nodes
        .toArray()
        .map(node => SERIALIZE.node(node, options))
    }
  },

  mark(mark, options = {}) {
    return {
      data: collapse(mark.data.toJSON()),
      kind: mark.kind,
      type: mark.type
    }
  },

  node(node, options) {
    switch (node.kind) {
      case 'block':
        return SERIALIZE.block(node, options)
      case 'inline':
        return SERIALIZE.inline(node, options)
      case 'text':
        return SERIALIZE.text(node, options)
      default: {
        throw new Error(`Unrecognized node kind "${node.kind}".`)
      }
    }
  },

  range(range, options = {}) {
    return {
      kind: range.kind,
      text: range.text,
      marks: range.marks
        .toArray()
        .map(mark => SERIALIZE.mark(mark, options))
    }
  },

  text(text, options = {}) {
    return {
      key: text.key,
      $type: 'paragraph',
      ranges: text
        .getRanges()
        .toArray()
        .map(range => SERIALIZE.range(range, options))
    }
  }
}

export default function fromSlate(state) {
  console.log(SERIALIZE.document(state.document)) // eslint-disable-line no-console
  console.log('RAW', Raw.serialize(state)) // eslint-disable-line no-console
  return Raw.serialize(state)
}
