import {merge} from 'lodash'
import rawMessages from 'all:locale:@sanity/base/locale-messages'

const mergedMessages = rawMessages.reduce((prev, curr) => {
  return merge(prev, curr)
})


function fetchMessages(locale) {
  return Promise.resolve(mergedMessages[locale])
}


module.exports = fetchMessages
