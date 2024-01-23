const {createSafeJsonParser} = require('@sanity/util/createSafeJsonParser')

/**
 * Safe JSON parser that is able to handle lines interrupted by an error object.
 *
 * This may occur when streaming NDJSON from the Export HTTP API.
 *
 * @internal
 * @see {@link https://github.com/sanity-io/sanity/pull/1787 | Initial pull request}
 */
module.exports = createSafeJsonParser({
  errorLabel: 'Error streaming dataset',
})
