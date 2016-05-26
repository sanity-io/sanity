import {merge} from 'lodash'
import rawMessages from 'all:locale:@sanity/base/locale-messages'

const mergedMessages = rawMessages.reduce((prev, curr) => {
  return merge(prev, curr)
})


function fetchLocalizedMessages(locale) {
  return Promise.resolve(mergedMessages[locale])
}

function fetchAllMessages() {
  return Promise.resolve(mergedMessages)
}


module.exports = {
  fetchLocalizedMessages,
  fetchAllMessages
}
