import React from 'react'
import * as ReactIntl from 'react-intl'

import languageResolver from './languageResolver'
import messagesFetcher from './messagesFetcher'

function wrappedReactIntlProvider(language, localizedMessages) {
  return function SanityIntlProvider(props) {
    return <ReactIntl.IntlProvider locale={language} messages={localizedMessages} {...props} />
  }
}

const SanityIntlPromise = languageResolver.then(language => {
  return messagesFetcher.fetchLocalizedMessages(language).then(localizedMessages => {
    const languagePrexif = language.split('-')[0]
    const localeData = require(`react-intl/locale-data/${languagePrexif}`)
    ReactIntl.addLocaleData(localeData)
    return {
      ReactIntl,
      SanityIntlProvider: wrappedReactIntlProvider(language, localizedMessages)
    }
  })
})

module.exports = SanityIntlPromise
