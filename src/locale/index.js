import React from 'react'
import * as ReactIntl from 'react-intl'

import languageResolver from './languageResolver'
import messagesFetcher from './messagesFetcher'

function wrappedReactIntlProvider(language, localizedMessages) {
  return function SanityIntlProvider(props) {
    return <ReactIntl.IntlProvider locale={language} messages={localizedMessages} {...props} />
  }
}

const SanityIntlProviderPromise = languageResolver.then(language => {
  return messagesFetcher.fetchLocalizedMessages(language).then(localizedMessages => {
    // TODO: ReactIntl.addLocaleData()
    return {
      ReactIntl,
      SanityIntlProvider: wrappedReactIntlProvider(language, localizedMessages)
    }
  })
})

module.exports = SanityIntlProviderPromise
