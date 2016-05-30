// Figure out which locale the user prefers.
// Return a promise in order to support asynchronous resolution.

const nav = typeof navigator === 'undefined' ? {} : navigator
const defaultLanguage = 'en-US'

function resolveLanguage(supportedLanguages = null) {
  let language = (nav.language || nav.browserLanguage || defaultLanguage)
  if (supportedLanguages && !supportedLanguages.includes(language)) {
    language = supportedLanguages[0]
  }
  return Promise.resolve(language)
}

module.exports = {
  resolveLanguage
}
