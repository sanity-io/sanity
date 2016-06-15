import merge from 'lodash/merge'
import rawMessages from 'all:locale:@sanity/base/locale-messages'

const mergedMessages = rawMessages.reduce((prev, curr) => merge(prev, curr), {})

function fetchLocalizedMessages(language) {
  const languagePrefix = language.split('-')[0]
  const localizedMessages = mergedMessages[language] || mergedMessages[languagePrefix]
  if (!localizedMessages) {
    console.warn(`No localized messages for language ${language}`) // eslint-disable-line no-console
  }
  return Promise.resolve(localizedMessages || {})
}

function fetchAllMessages() {
  return Promise.resolve(mergedMessages)
}

module.exports = {
  fetchLocalizedMessages,
  fetchAllMessages
}
