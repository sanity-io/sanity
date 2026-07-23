'use strict'

/**
 * Define a GROQ query. This is a no-op, but it helps editor integrations
 * understand that a string represents a GROQ query in order to provide syntax highlighting
 * and other features.
 *
 * Ideally the `groq` template tag would be used, but we cannot infer types from it until
 * microsoft/TypeScript#33304 is resolved. Otherwise, there is no difference between this
 * and the `groq` template tag.
 *
 * @param query - The GROQ query
 * @returns The same string as the input
 * @public
 */
function defineQuery(query) {
  return query
}

/**
 * Pass-through groq template tag. This is a no-op, but it helps editor integrations
 * understand that a string represents a GROQ query in order to provide syntax highlighting
 * and other features.
 *
 * @param strings - Template string parts
 * @param keys - Template string keys
 * @returns The same string as the input
 * @public
 */
function groq(strings, ...keys) {
  const lastIndex = strings.length - 1
  return (
    strings.slice(0, lastIndex).reduce((acc, str, i) => acc + str + keys[i], '') +
    strings[lastIndex]
  )
}

// `require('groq')` returns the tag function itself
module.exports = groq
module.exports.defineQuery = defineQuery
