// @flow

import blockContentTypeToOptions from './util/blockContentTypeToOptions'
import blocksToSlateState from './converters/blocksToSlateState'
import HtmlDeserializer from './HtmlDeserializer'
import slateStateToBlocks from './converters/slateStateToBlocks'

/**
 * BlockTools - various tools for Sanity block content
 *
 * @param {Object} blockContentType
 *    The compiled schema for the block content type to work with
 *
 */
export default {
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
  htmlToBlocks(html, options = {}) {
    const deserializer = new HtmlDeserializer(options)
    return deserializer.deserialize(html)
  },

  /**
   * Convert a serialized Slate state to blocks
   *
   * @param {Object} An object representing the structure of the Slate JSON.
   * @param {Object} blockContentType
   * @returns {Array} Blocks
   */
  slateStateToBlocks(slateJson, blockContentType) {
    return slateStateToBlocks(slateJson, blockContentType)
  },

  /**
   * Convert blocks to a serialized Slate state
   *
   * @param {Array} blocks
   * @param {Object} blockContentType
   * @returns {Object} An object representing the serialized Slate state.
   */

  blocksToSlateState(blocks, blockContentType) {
    return blocksToSlateState(blocks, blockContentType)
  },

  /**
   * Returns the feature-set of a compiled block content type.
   *
   * @param {Object} blockContentType
   * @returns {Object} The feature-set
   */
  getBlockContentFeatures(blockType) {
    return blockContentTypeToOptions(blockType)
  }
}
