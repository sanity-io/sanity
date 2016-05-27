// Figure out which locale the user prefers.
// Return a promise in order to support asynchronous resolution.

const nav = typeof navigator === 'undefined' ? {} : navigator
const defaultLanguage = 'en-US'
const language = (nav.language || nav.browserLanguage || defaultLanguage)

module.exports = Promise.resolve(language)
