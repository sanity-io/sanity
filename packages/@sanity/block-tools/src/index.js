// @flow

import blockContentTypeToOptions from './util/blockContentTypeToOptions'
import _blocksToEditorValue from './converters/blocksToEditorValue'
import _editorValueToBlocks from './converters/editorValueToBlocks'
import HtmlDeserializer from './HtmlDeserializer'
import {SLATE_DEFAULT_BLOCK} from './constants'
import _normalizeBlock from './util/normalizeBlock'

/**
 * BlockTools - various tools for Sanity block content
 *
 * @param {Object} blockContentType
 *    The compiled schema for the block content type to work with
 *
 */
const blockContentFunctions = {
  /**
   * Convert HTML to blocks respecting the block content type's schema
   *
   * @param {String} html
   *
   * @param {Object} options
   *   @property {Object} blockContentType
   *      A compiled version of the schema type for the block content
   *   @property {Array} rules
   *      Optional rules working on the HTML (will be ruled first)
   *   @property {Function} parseHtml
   *      API compatible model as returned from DOMParser for using server side.
   * @returns {Array} Blocks
   */
  htmlToBlocks(html: string, blockContentType: {}, options = {}) {
    const deserializer = new HtmlDeserializer(blockContentType, options)
    return deserializer.deserialize(html)
  },

  /**
   * Convert a serialized editor value to blocks
   *
   * @param {Object} An object representing the structure of the editor value.
   * @param {Object} blockContentType
   * @returns {Array} Blocks
   */
  editorValueToBlocks(value, blockContentType, options = {}) {
    return _editorValueToBlocks(value, blockContentType, options)
  },

  /**
   * Convert blocks to a serialized editor value
   *
   * @param {Array} blocks
   * @param {Object} blockContentType
   * @returns {Object} An object representing the serialized editor value.
   */
  blocksToEditorValue(blocks, blockContentType, options = {}) {
    return _blocksToEditorValue(blocks, blockContentType, options)
  },

  /**
   * Returns the feature-set of a compiled block content type.
   *
   * @param {Object} blockContentType
   * @returns {Object} The feature-set
   */
  getBlockContentFeatures(blockContentType) {
    return blockContentTypeToOptions(blockContentType)
  }
}

export default blockContentFunctions

export const EDITOR_DEFAULT_BLOCK_TYPE = SLATE_DEFAULT_BLOCK
export const htmlToBlocks = blockContentFunctions.htmlToBlocks
export const editorValueToBlocks = blockContentFunctions.editorValueToBlocks
export const blocksToEditorValue = blockContentFunctions.blocksToEditorValue
export const getBlockContentFeatures = blockContentFunctions.getBlockContentFeatures
export const normalizeBlock = _normalizeBlock
