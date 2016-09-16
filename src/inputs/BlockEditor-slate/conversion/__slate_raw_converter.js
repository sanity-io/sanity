
import Block from '../models/block'
import Character from '../models/character'
import Document from '../models/document'
import Inline from '../models/inline'
import Mark from '../models/mark'
import State from '../models/state'
import Text from '../models/text'
import isEmpty from 'is-empty'

/**
 * Deserialize a JSON `object`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Block}
 */

deserialize(object, options) {
  return Raw.deserializeState(object, options)
},

/**
 * Deserialize a JSON `object` representing a `Block`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Block}
 */

deserializeBlock(object, options = {}) {
  if (options.terse) object = Raw.untersifyBlock(object)

  return Block.create({
    key: object.key,
    type: object.type,
    data: object.data,
    isVoid: object.isVoid,
    nodes: Block.createList(object.nodes.map((node) => {
      return Raw.deserializeNode(node, options)
    }))
  })
},

/**
 * Deserialize a JSON `object` representing a `Document`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Document}
 */

deserializeDocument(object, options) {
  return Document.create({
    nodes: Block.createList(object.nodes.map((node) => {
      return Raw.deserializeNode(node, options)
    }))
  })
},

/**
 * Deserialize a JSON `object` representing an `Inline`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Inline}
 */

deserializeInline(object, options = {}) {
  if (options.terse) object = Raw.untersifyInline(object)

  return Inline.create({
    key: object.key,
    type: object.type,
    data: object.data,
    isVoid: object.isVoid,
    nodes: Inline.createList(object.nodes.map((node) => {
      return Raw.deserializeNode(node, options)
    }))
  })
},

/**
 * Deserialize a JSON `object` representing a `Mark`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Mark} mark
 */

deserializeMark(object, options) {
  return Mark.create(object)
},

/**
 * Deserialize a JSON object representing a `Node`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Text}
 */

deserializeNode(object, options) {
  switch (object.kind) {
    case 'block': return Raw.deserializeBlock(object, options)
    case 'document': return Raw.deserializeDocument(object, options)
    case 'inline': return Raw.deserializeInline(object, options)
    case 'text': return Raw.deserializeText(object, options)
    default: {
      throw new Error(`Unrecognized node kind "${object.kind}".`)
    }
  }
},

/**
 * Deserialize a JSON `object` representing a `Range`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {List}
 */

deserializeRange(object, options = {}) {
  if (options.terse) object = Raw.untersifyRange(object)

  return Character.createList(object.text
    .split('')
    .map((char) => {
      return Character.create({
        text: char,
        marks: Mark.createSet(object.marks.map((mark) => {
          return Raw.deserializeMark(mark, options)
        }))
      })
    }))
},

/**
 * Deserialize a JSON `object` representing a `State`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {State}
 */

deserializeState(object, options = {}) {
  if (options.terse) object = Raw.untersifyState(object)

  return State.create({
    document: Raw.deserializeDocument(object.document, options)
  })
},

/**
 * Deserialize a JSON `object` representing a `Text`.
 *
 * @param {Object} object
 * @param {Object} options (optional)
 * @return {Text}
 */

deserializeText(object, options = {}) {
  if (options.terse) object = Raw.untersifyText(object)

  return Text.create({
    key: object.key,
    characters: object.ranges.reduce((characters, range) => {
      return characters.concat(Raw.deserializeRange(range, options))
    }, Character.createList())
  })
},
