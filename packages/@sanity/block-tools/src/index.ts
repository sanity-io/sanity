import blockContentTypeFeatures from './util/blockContentTypeFeatures'
import HtmlDeserializer from './HtmlDeserializer'
import {SLATE_DEFAULT_BLOCK} from './constants'
import _normalizeBlock from './util/normalizeBlock'
import _randomKey from './util/randomKey'

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
  htmlToBlocks(html, blockContentType, options = {}) {
    const deserializer = new HtmlDeserializer(blockContentType, options)
    return deserializer.deserialize(html).map(_normalizeBlock)
  },
  /**
   * Returns the feature-set of a compiled block content type.
   *
   * @param {Object} blockContentType
   * @returns {Object} The feature-set
   */
  getBlockContentFeatures(blockContentType) {
    return blockContentTypeFeatures(blockContentType)
  },

  randomKey(length) {
    return _randomKey(length)
  },
}

export default blockContentFunctions

export const EDITOR_DEFAULT_BLOCK_TYPE = SLATE_DEFAULT_BLOCK
export const htmlToBlocks = blockContentFunctions.htmlToBlocks
export const getBlockContentFeatures = blockContentFunctions.getBlockContentFeatures
export const normalizeBlock = _normalizeBlock
export const randomKey = _randomKey
